/**
 * Simple Speech Service using Web Speech API.
 */
class SpeechService {
  constructor() {
    this.synth = window.speechSynthesis;
  }

  speak(text) {
    if (!this.synth) return;
    
    // Stop any current speech
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;
    
    // Find a nice female voice if available
    const voices = this.synth.getVoices();
    const preferredVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Female'));
    if (preferredVoice) utterance.voice = preferredVoice;

    this.synth.speak(utterance);
  }

  welcome(name) {
    this.speak(`Welcome, ${name}. Your identity has been verified.`);
  }

  accessDenied() {
    this.speak(`Access denied. Face not recognized.`);
  }

  spoofDetected() {
    this.speak(`Security alert. Spoof attempt detected.`);
  }
}

export const speechService = new SpeechService();
