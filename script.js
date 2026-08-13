const FIREBASE =
"https://air-32-default-rtdb.asia-southeast1.firebasedatabase.app";

let setTemp = 25;
let acPower = 1;

let currentMode = 1;
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

    console.log("GET ERROR", error);

    return null;
  }
}


/* =====================================================
   FIREBASE PUT
===================================================== */

async function fbPut(path, value) {

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

    if (!response.ok) {

      console.log(
        "PUT ERROR",
        response.status
      );

      return false;
    }

    return true;

  } catch (error) {

    console.log(
      "PUT ERROR",
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
    document.getElementById("wifiDot");

  const label =
    document.getElementById("wifiLabel");

  const bar =
    document.getElementById("offlineBar");

  dot.className =
    "wifi-dot" +
    (ok ? "" : " off");

  label.textContent =
    ok ? "ONLINE" : "OFFLINE";

  bar.className =
    "offline-bar" +
    (ok ? "" : " show");
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


  /* DHT */

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


  /* PZEM */

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
   READ CONTROL
===================================================== */

async function pollControl() {

  const ctrl =
    await fbGet("/control");


  if (!ctrl) {
    return;
  }


  /* TEMP */

  if (ctrl.temp !== undefined) {

    setTemp =
      parseInt(ctrl.temp);

    document.getElementById(
      "setTempVal"
    ).textContent =
      setTemp + "°";
  }


  /* POWER */

  if (ctrl.power !== undefined) {

    acPower =
      parseInt(ctrl.power);

    updatePowerButton();
  }


  /* MODE */

  if (ctrl.mode !== undefined) {

    currentMode =
      parseInt(ctrl.mode);

    updateModeButton(
      currentMode
    );
  }


  /* FAN */

  if (ctrl.fan !== undefined) {

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


async function togglePower() {

  acPower =
    acPower === 1
      ? 0
      : 1;


  updatePowerButton();


  const ok =
    await fbPut(
      "/control/power",
      acPower
    );


  if (!ok) {

    console.log(
      "ไม่สามารถเปลี่ยน POWER"
    );
  }
}


/* =====================================================
   MODE
===================================================== */

function updateModeButton(mode) {

  document
    .querySelectorAll(".mode-btn")
    .forEach(
      button => {

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


async function setMode(el) {

  const mode =
    parseInt(
      el.dataset.mode
    );


  currentMode =
    mode;


  /* เปลี่ยนหน้าจอทันที */

  updateModeButton(
    mode
  );


  /* Firebase */

  const ok =
    await fbPut(
      "/control/mode",
      mode
    );


  console.log(
    "MODE =",
    mode,
    "Firebase =",
    ok
  );
}


/* =====================================================
   FAN
===================================================== */

function updateFanButton(fan) {

  const labels = [
    "AUTO",
    "LOW",
    "MED",
    "HIGH"
  ];


  document
    .querySelectorAll(".fan-step")
    .forEach(
      button => {

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
    labels[fan] || "AUTO";
}


async function setFan(el) {

  const fan =
    parseInt(
      el.dataset.fan
    );


  currentFan =
    fan;


  /* เปลี่ยนหน้าจอทันที */

  updateFanButton(
    fan
  );


  /* Firebase */

  const ok =
    await fbPut(
      "/control/fan",
      fan
    );


  console.log(
    "FAN =",
    fan,
    "Firebase =",
    ok
  );
}


/* =====================================================
   TEMPERATURE
===================================================== */

async function adjustTemp(change) {

  setTemp += change;


  if (setTemp < 16) {
    setTemp = 16;
  }

  if (setTemp > 30) {
    setTemp = 30;
  }


  document.getElementById(
    "setTempVal"
  ).textContent =
    setTemp + "°";


  const ok =
    await fbPut(
      "/control/temp",
      setTemp
    );


  console.log(
    "TEMP =",
    setTemp,
    "Firebase =",
    ok
  );
}


/* =====================================================
   START
===================================================== */

pollSensors();

pollControl();


setInterval(
  pollSensors,
  5000
);


setInterval(
  pollControl,
  2000
);
