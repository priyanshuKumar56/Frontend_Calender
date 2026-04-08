export const monthThemes = [
  { name:'January', gradient:'linear-gradient(135deg,#0c1445,#1a237e,#283593)', accent:'#64b5f6', secondary:'#42a5f5', emoji:'❄️' },
  { name:'February', gradient:'linear-gradient(135deg,#880e4f,#ad1457,#c62828)', accent:'#f48fb1', secondary:'#ec407a', emoji:'💕' },
  { name:'March', gradient:'linear-gradient(135deg,#1b5e20,#2e7d32,#558b2f)', accent:'#81c784', secondary:'#66bb6a', emoji:'🌸' },
  { name:'April', gradient:'linear-gradient(135deg,#0d4f3c,#00695c,#00897b)', accent:'#4dd0e1', secondary:'#26c6da', emoji:'🌷' },
  { name:'May', gradient:'linear-gradient(135deg,#e65100,#f57c00,#ff9800)', accent:'#ffcc80', secondary:'#ffb74d', emoji:'🌻' },
  { name:'June', gradient:'linear-gradient(135deg,#4a148c,#6a1b9a,#7b1fa2)', accent:'#ce93d8', secondary:'#ab47bc', emoji:'☀️' },
  { name:'July', gradient:'linear-gradient(135deg,#01579b,#0277bd,#0288d1)', accent:'#4fc3f7', secondary:'#29b6f6', emoji:'🏖️' },
  { name:'August', gradient:'linear-gradient(135deg,#004d40,#00695c,#00796b)', accent:'#80cbc4', secondary:'#4db6ac', emoji:'🌿' },
  { name:'September', gradient:'linear-gradient(135deg,#bf360c,#d84315,#e64a19)', accent:'#ffab91', secondary:'#ff8a65', emoji:'🍂' },
  { name:'October', gradient:'linear-gradient(135deg,#3e2723,#4e342e,#5d4037)', accent:'#ffab40', secondary:'#ff9100', emoji:'🎃' },
  { name:'November', gradient:'linear-gradient(135deg,#263238,#37474f,#455a64)', accent:'#b0bec5', secondary:'#90a4ae', emoji:'🍁' },
  { name:'December', gradient:'linear-gradient(135deg,#1a237e,#283593,#303f9f)', accent:'#ef5350', secondary:'#e53935', emoji:'🎄' },
];

export function getMonthTheme(monthIndex) {
  return monthThemes[monthIndex % 12];
}
