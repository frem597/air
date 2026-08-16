/* =====================================================
   FIREBASE
===================================================== */

const FIREBASE =
"https://air-32-default-rtdb.asia-southeast1.firebasedatabase.app";


/* =====================================================
   STATE
===================================================== */

let setTemp = 24;

let acPower = 0;

let currentMode = 0;

let currentFan = 0;


/* =====================================================
   FIREBASE GET
===================================================== */

async function fbGet(path) {

  try {

    const response =
      await fetch(
        FIREBASE + path + ".json"
      );

    if (!response.ok) {

      return null;

    }

    return await response.json();

  } catch (error) {

    console.error(
      "Firebase GET:",
      error
    );

    return null;

  }

}


/* =====================================================
   FIREBASE PUT
===================================================== */

async function fbPut(path,value) {

  try {

    const response =
      await fetch(
        FIREBASE + path + ".json",
        {

          method: "PUT",

          headers: {
            "Content-Type":
            "application/json"
          },

          body:
            JSON.stringify(value)

        }
      );


    return response.ok;

  } catch (error) {

    console.error(
      "Firebase PUT:",
      error
    );

    return false;

  }

}


/* =====================================================
   ONLINE
===================================================== */

function setOnline(ok) {

  const dot =
    document.getElementById(
      "wifiDot"
    );

  const label =
    document.getElementById(
      "wifiLabel"
    );

  const offline =
    document.getElementById(
      "offlineBar"
    );


  if (ok) {

    dot.className =
      "wifi-dot";

    label.textContent =
      "ONLINE";

    offline.className =
      "offline-bar";

  } else {

    dot.className =
      "wifi-dot off";

    label.textContent =
      "OFFLINE";

    offline.className =
      "offline-bar show";

  }

}


/* =====================================================
   SENSOR
===================================================== */

async function pollSensors() {

  const dht =
    await fbGet("/dht");

  const sensor =
    await fbGet("/sensor");


  if (!dht && !sensor) {

    setOnline(false);

    return;

  }


  setOnline(true);


  /* ================= DHT ================= */

  if (dht) {

    if (
      dht.temp !== null &&
      dht.temp !== undefined
    ) {

      document.getElementById(
        "roomTemp"
      ).textContent =
        parseFloat(
          dht.temp
        ).toFixed(1);

    }


    if (
      dht.humidity !== null &&
      dht.humidity !== undefined
    ) {

      document.getElementById(
        "roomHum"
      ).textContent =
        parseFloat(
          dht.humidity
        ).toFixed(0);

    }

  }


  /* ================= PZEM ================= */

  if (sensor) {

    document.getElementById(
      "statVolt"
    ).textContent =

      sensor.voltage != null
        ? parseFloat(
            sensor.voltage
          ).toFixed(0)
        : "--";


    document.getElementById(
      "statPow"
    ).textContent =

      sensor.power != null
        ? parseFloat(
            sensor.power
          ).toFixed(0)
        : "--";


    document.getElementById(
      "statCurrent"
    ).textContent =

      sensor.current != null
        ? parseFloat(
            sensor.current
          ).toFixed(2)
        : "--";


    /* ================= KWH ================= */

    if (
      sensor.kwh !== undefined &&
      sensor.kwh !== null
    ) {

      document.getElementById(
        "statKwh"
      ).textContent =
        parseFloat(
          sensor.kwh
        ).toFixed(3);

    }

  }


  document.getElementById(
    "lastUpdate"
  ).textContent =
    "อัปเดตล่าสุด " +
    new Date().toLocaleTimeString(
      "th-TH"
    );

}


/* =====================================================
   CONTROL
===================================================== */

async function pollControl() {

  const ctrl =
    await fbGet("/control");


  if (!ctrl) {

    return;

  }


  /* ================= TEMP ================= */

  if (
    ctrl.temp !== undefined &&
    ctrl.temp !== null
  ) {

    setTemp =
      parseInt(ctrl.temp);


    document.getElementById(
      "setTempVal"
    ).textContent =
      setTemp + "°";

  }


  /* ================= POWER ================= */

  if (
    ctrl.power !== undefined &&
    ctrl.power !== null
  ) {

    acPower =
      parseInt(ctrl.power);

    updatePowerButton();

  }


  /* ================= MODE ================= */

  if (
    ctrl.mode !== undefined &&
    ctrl.mode !== null
  ) {

    currentMode =
      parseInt(ctrl.mode);

    updateModeButton(
      currentMode
    );

  }


  /* ================= FAN ================= */

  if (
    ctrl.fan !== undefined &&
    ctrl.fan !== null
  ) {

    currentFan =
      parseInt(ctrl.fan);

    updateFanButton(
      currentFan
    );

  }

}


/* =====================================================
   POWER BUTTON
===================================================== */

function updatePowerButton() {

  const btn =
    document.getElementById(
      "powerBtn"
    );


  if (acPower === 1) {

    btn.className =
      "power-toggle on";

    btn.textContent =
      "ON";

  } else {

    btn.className =
      "power-toggle";

    btn.textContent =
      "OFF";

  }

}


/* =====================================================
   TOGGLE POWER
===================================================== */

async function togglePower() {

  const newPower =
    acPower === 1
      ? 0
      : 1;


  /* เปลี่ยนหน้าจอทันที */

  acPower =
    newPower;

  updatePowerButton();


  /* Firebase */

  const success =
    await fbPut(
      "/control/power",
      newPower
    );


  if (!success) {

    console.log(
      "เปลี่ยน Power ไม่สำเร็จ"
    );

  }

}


/* =====================================================
   TEMPERATURE
===================================================== */

async function adjustTemp(change) {

  let newTemp =
    setTemp + change;


  if (newTemp < 16)
    newTemp = 16;


  if (newTemp > 30)
    newTemp = 30;


  setTemp =
    newTemp;


  document.getElementById(
    "setTempVal"
  ).textContent =
    setTemp + "°";


  await fbPut(
    "/control/temp",
    setTemp
  );

}


/* =====================================================
   MODE BUTTON
===================================================== */

function updateModeButton(mode) {

  document
    .querySelectorAll(
      ".mode-btn"
    )
    .forEach(
      function(button) {

        button.classList.remove(
          "active"
        );

      }
    );


  const button =
    document.querySelector(
      '.mode-btn[data-mode="' +
      mode +
      '"]'
    );


  if (button) {

    button.classList.add(
      "active"
    );

  }

}


/* =====================================================
   SET MODE
===================================================== */

async function setMode(el) {

  const mode =
    parseInt(
      el.dataset.mode
    );


  /* เปลี่ยนหน้าจอทันที */

  currentMode =
    mode;

  updateModeButton(
    mode
  );


  /* Firebase */

  const success =
    await fbPut(
      "/control/mode",
      mode
    );


  if (!success) {

    console.log(
      "เปลี่ยน Mode ไม่สำเร็จ"
    );

  }

}


/* =====================================================
   FAN BUTTON
===================================================== */

function updateFanButton(fan) {

  const labels = [

    "AUTO",
    "LOW",
    "MED",
    "HIGH"

  ];


  document
    .querySelectorAll(
      ".fan-step"
    )
    .forEach(
      function(button) {

        button.classList.remove(
          "active"
        );

      }
    );


  const button =
    document.querySelector(
      '.fan-step[data-fan="' +
      fan +
      '"]'
    );


  if (button) {

    button.classList.add(
      "active"
    );

  }


  document.getElementById(
    "fanLabel"
  ).textContent =
    labels[fan] ||
    "AUTO";

}


/* =====================================================
   SET FAN
===================================================== */

async function setFan(el) {

  const fan =
    parseInt(
      el.dataset.fan
    );


  currentFan =
    fan;


  updateFanButton(
    fan
  );


  const success =
    await fbPut(
      "/control/fan",
      fan
    );


  if (!success) {

    console.log(
      "เปลี่ยน Fan ไม่สำเร็จ"
    );

  }

}


/* =====================================================
   USAGE
===================================================== */

async function loadUsage() {

  const minutes =
    await fbGet(
      "/usage/totalMinutes"
    );


  if (
    minutes !== null &&
    minutes !== undefined
  ) {

    const value =
      parseInt(minutes) || 0;


    document.getElementById(
      "statTime"
    ).textContent =
      value;


    /*
      ค่าไฟประมาณการจากพลังงาน
      ถ้ามี kWh จาก PZEM จะคำนวณด้านล่าง
    */

  } else {

    document.getElementById(
      "statTime"
    ).textContent =
      "0";

  }

}


/* =====================================================
   COST
===================================================== */

async function calculateCost() {

  const sensor =
    await fbGet(
      "/sensor"
    );


  if (!sensor) {

    return;

  }


  const kwh =
    parseFloat(
      sensor.kwh
    ) || 0;


  /*
     ค่าไฟประมาณ 4.50 บาท/kWh
     สามารถเปลี่ยนได้
  */

  const rate =
    4.50;


  const cost =
    kwh * rate;


  document.getElementById(
    "statCost"
  ).textContent =
    cost.toFixed(2);

}


/* =====================================================
   START
===================================================== */

pollSensors();

pollControl();

loadUsage();

calculateCost();


/* =====================================================
   UPDATE EVERY 5 SEC
===================================================== */

setInterval(
  function() {

    pollSensors();

    pollControl();

    loadUsage();

    calculateCost();

  },
  5000
);
