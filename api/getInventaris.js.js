// api/getInventaris.js

export default async function handler(req, res) {
  try {
    const response = await fetch("https://script.google.com/macros/s/AKfycbygw1x_Vu3zrx547rnfB2dUodYo12uVSgcSA3AUlnc9AQgt7NxOs6iWAe_2uigoMorr/exec");
    const data = await response.json();
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Fetch failed', detail: error.message });
  }
}
