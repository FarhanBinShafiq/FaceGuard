import { useRef, useState, useCallback } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'

export default function ImageUpload({ onImageSelect, disabled = false }) {
  const inputRef = useRef(null)
  const [preview, setPreview] = useState(null)
  const [fileName, setFileName] = useState('')
  const [dragging, setDragging] = useState(false)

  const handleFile = useCallback((file) => {
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    const allowed = ['jpg', 'jpeg', 'png', 'webp', 'bmp']
    if (!allowed.includes(ext)) {
      alert(`Invalid file type. Allowed: ${allowed.join(', ')}`)
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('File too large. Maximum: 10 MB')
      return
    }

    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target.result)
    }
    reader.readAsDataURL(file)
    onImageSelect?.(file)
  }, [onImageSelect])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true) }
  const handleDragLeave = () => setDragging(false)

  const clearImage = () => {
    setPreview(null)
    setFileName('')
    onImageSelect?.(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  if (preview) {
    return (
      <div>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img src={preview} alt="Preview" className="preview-image" />
          <button
            className="btn btn-icon btn-danger"
            onClick={clearImage}
            style={{ position: 'absolute', top: 8, right: 8 }}
            title="Remove image"
          >
            <X size={16} />
          </button>
        </div>
        <p className="text-sm text-muted mt-sm">{fileName}</p>
      </div>
    )
  }

  return (
    <div
      className={`upload-area ${dragging ? 'dragging' : ''}`}
      onClick={() => inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/bmp"
        style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files[0])}
        disabled={disabled}
      />
      <Upload size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
      <p style={{ fontWeight: 600 }}>Drop an image here or click to upload</p>
      <p className="text-sm text-muted mt-sm">JPG, PNG, WebP or BMP • Max 10 MB</p>
    </div>
  )
}
