
  const FIREBASE = "https://esp32-a511e-default-rtdb.asia-southeast1.firebasedatabase.app";

  let setTemp = 24;
  let acPower = 1;

  async function fbGet(path) {
    try {
      const r = await fetch(FIREBASE + path + ".json");
      if (!r.ok) return null;
      return await r.json();
    } catch { return null; }
  }

  async function fbPut(path, val) {
    try {
      await fetch(FIREBASE + path + ".json", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(val)
      });
    } catch {}
  }

  function setOnline(ok) {
    document.getElementById("wifiDot").className = "wifi-dot" + (ok ? "" : " off");
    document.getElementById("wifiLabel").textContent = ok ? "ONLINE" : "OFFLINE";
    document.getElementById("offlineBar").className = "offline-bar" + (ok ? "" : " show");
  }

  async function pollSensors() {
    const dht = await fbGet("/dht");
    const sensor = await fbGet("/sensor");

    if (!dht && !sensor) { setOnline(false); return; }
    setOnline(true);

    if (dht) {
      document.getElementById("roomTemp").textContent =
        dht.temp !== null && dht.temp !== undefined ? parseFloat(dht.temp).toFixed(1) : "--";
      document.getElementById("roomHum").textContent =
        dht.humidity !== null && dht.humidity !== undefined ? parseFloat(dht.humidity).toFixed(0) : "--";
    }

    if (sensor) {
      document.getElementById("statVolt").textContent =
        sensor.voltage != null ? parseFloat(sensor.voltage).toFixed(0) : "--";
      document.getElementById("statPow").textContent =
        sensor.power != null ? parseFloat(sensor.power).toFixed(0) : "--";
      document.getElementById("statKwh").textContent =
        sensor.kwh != null ? parseFloat(sensor.kwh).toFixed(2) : "--";
    }

    const now = new Date();
    document.getElementById("lastUpdate").textContent =
      "อัปเดตล่าสุด " + now.toLocaleTimeString("th-TH");
  }

  async function pollControl() {
    const ctrl = await fbGet("/control");
    if (!ctrl) return;

    if (ctrl.temp !== undefined) {
      setTemp = parseInt(ctrl.temp);
      document.getElementById("setTempVal").textContent = setTemp + "°";
    }
    if (ctrl.power !== undefined) {
      acPower = parseInt(ctrl.power);
      document.getElementById("powerBtn").className =
        "power-toggle" + (acPower === 1 ? " on" : "");
    }
    if (ctrl.mode !== undefined) {
      document.querySelectorAll(".mode-btn").forEach(b => b.classList.remove("active"));
      const m = document.querySelector('[data-mode="' + ctrl.mode + '"]');
      if (m) m.classList.add("active");
    }
    if (ctrl.fan !== undefined) {
      const labels = ["AUTO","LOW","MED","HIGH"];
      document.querySelectorAll(".fan-step").forEach(b => b.classList.remove("active"));
      const f = document.querySelector('[data-fan="' + ctrl.fan + '"]');
      if (f) f.classList.add("active");
      document.getElementById("fanLabel").textContent = labels[ctrl.fan] || "AUTO";
    }
  }

  function adjustTemp(d) {
    setTemp = Math.max(16, Math.min(30, setTemp + d));
    document.getElementById("setTempVal").textContent = setTemp + "°";
    fbPut("/control/temp", setTemp);
  }

  function togglePower() {
    acPower = acPower === 1 ? 0 : 1;
    document.getElementById("powerBtn").className =
      "power-toggle" + (acPower === 1 ? " on" : "");
    fbPut("/control/power", acPower);
  }

  function setMode(el) {
    document.querySelectorAll(".mode-btn").forEach(b => b.classList.remove("active"));
    el.classList.add("active");
    fbPut("/control/mode", parseInt(el.dataset.mode));
  }

  function setFan(el) {
    const labels = ["AUTO","LOW","MED","HIGH"];
    document.querySelectorAll(".fan-step").forEach(b => b.classList.remove("active"));
    el.classList.add("active");
    const fan = parseInt(el.dataset.fan);
    document.getElementById("fanLabel").textContent = labels[fan];
    fbPut("/control/fan", fan);
  }

  pollSensors();
  pollControl();
  setInterval(pollSensors, 5000);
  setInterval(pollControl, 3000);
