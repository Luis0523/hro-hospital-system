export function reproducirBeep() {
  try {
    const Contexto = window.AudioContext || window.webkitAudioContext
    if (!Contexto) return
    const contexto = new Contexto()
    const oscilador = contexto.createOscillator()
    const ganancia = contexto.createGain()
    oscilador.connect(ganancia)
    ganancia.connect(contexto.destination)
    oscilador.type = 'sine'
    oscilador.frequency.value = 880
    ganancia.gain.value = 0.06
    oscilador.start()
    oscilador.stop(contexto.currentTime + 0.16)
    oscilador.onended = () => contexto.close()
  } catch {
    return
  }
}
