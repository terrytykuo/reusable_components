/** True when launched from the home screen (installed PWA), the only place iOS delivers web push. */
export function isStandalone(): boolean {
  const displayStandalone = window.matchMedia?.('(display-mode: standalone)').matches ?? false
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true
  return displayStandalone || iosStandalone
}
