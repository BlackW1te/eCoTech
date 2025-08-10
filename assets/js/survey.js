/* survey.js
   Multi-step survey + calculation logic.
   IMPORTANT: Replace the placeholder/example values in EMISSION_FACTORS with the official TÜİK katsayıları.
*/

window.addEventListener('DOMContentLoaded', function () {

  // ====== 1) EMISSION FACTORS - TODO: Replace with TÜİK resmi değerleri (units indicated) ======
  // Birimler: sonuç kg CO2e cinsinden olacak.
  // electricity_kWh:  kg CO2e per kWh
  // naturalGas_m3:    kg CO2e per m3
  // lpg_l:            kg CO2e per litre
  // fuelOil_l:        kg CO2e per litre
  // coal_ton:         kg CO2e per ton (eğer TÜİK ton bazlı değilse düzelt)
  // centralHeat_kWh:  kg CO2e per kWh (veya GJ; birime göre kodda dönüş yap)
  // flight_each:      kg CO2e per 1 uçuş (kullanım kolaylığı için uçuş başına değer)
  // car_km, van_km, truck_km, bus_km, metro_km, taxi_km: kg CO2e per km
  // paper_per_sheet:  kg CO2e per sheet
  // cardboard_per_unit: kg CO2e per adet (veya kg; sen karar ver, katsayı buna göre)
  // water_m3:         kg CO2e per m3 (opsiyonel)
  // waste_nonrec_kg, waste_rec_kg: kg CO2e per kg (opsiyonel)

  const EMISSION_FACTORS = {
    electricity_kWh: 0.45,    // Örnek: 0.45 kg CO2e / kWh  (REPLACE with TÜİK)
    renewable_kWh: 0.00,      // Yenilenebilir üretim için doğrudan 0 kabul edilebilir
    naturalGas_m3: 2.03,      // Örnek - kg CO2e / m3 (REPLACE)
    lpg_l: 1.51,              // kg CO2e / litre (EXAMPLE)
    fuelOil_l: 2.68,          // kg CO2e / litre (EXAMPLE)
    coal_ton: 2500,           // örnek: 2500 kg CO2e / ton => = 2.5 kg/kg (REPLACE)
    centralHeat_kWh: 0.25,    // kg CO2e / kWh (REPLACE)
    flight_each: 120,         // kg CO2e per uçuş (örnek, kısa uçuş) => TÜİK'e göre düzelt
    car_km: 0.12,             // kg CO2e / km (örnek)
    van_km: 0.24,
    truck_km: 0.88,
    service_km: 0.12,
    bus_km: 0.08,
    metro_km: 0.06,
    taxi_km: 0.18,
    paper_per_sheet: 0.005,   // kg CO2e per A4 sheet (örnek)
    cardboard_per_unit: 0.5,  // kg CO2e per kutu (örnek); eğer kg verilecekse burayı değiştir
    water_m3: 0.344,          // kg CO2e per m3 su (örnek)
    waste_nonrec_kg: 0.21,    // kg CO2e per kg atık (örnek)
    waste_rec_kg: 0.03        // kg CO2e per kg geri dönüştürülen atık (örnek)
  };

  // ====== 2) DOM & state ======
  const steps = Array.from(document.querySelectorAll('.survey-step'));
  const totalSteps = steps.length - 1; // son adım (index) result block vs step count; burada total adım sayısı = 20 (index 0..19), result index 20
  const progressBar = document.getElementById('surveyProgressBar');
  const stepLabel = document.getElementById('surveyStepLabel');
  const form = document.getElementById('surveyForm');
  const resultBlock = document.getElementById('surveyResultBlock');
  const resultSummary = document.getElementById('resultSummary');
  const resultTotal = document.getElementById('resultTotal');
  const resultBreakdown = document.getElementById('resultBreakdown');
  const resultNote = document.getElementById('resultNote');

  let currentStep = 0;

  // Helper to show/hide steps
  function showStep(index) {
    // clamp
    if (index < 0) index = 0;
    if (index > steps.length - 1) index = steps.length - 1;

    // hide current
    steps.forEach((s, i) => {
      if (i === index) {
        s.classList.add('active');
      } else {
        s.classList.remove('active');
      }
    });

    currentStep = index;
    updateProgress();
    stepLabel.innerText = `${Math.min(currentStep + 1, 20)} / 20`;
  }

  function updateProgress() {
    // progress percent based on position among first 20 inputs (0..19)
    const percent = ((Math.min(currentStep, 19) + 1) / 20) * 100;
    progressBar.style.width = `${percent}%`;
  }

  // attach next/prev handlers (delegation)
  form.addEventListener('click', function (ev) {
    const nextBtn = ev.target.closest('[data-next]');
    const prevBtn = ev.target.closest('.btn-prev');

    if (nextBtn) {
      ev.preventDefault();
      handleNext();
      return;
    }
    if (prevBtn) {
      ev.preventDefault();
      handlePrev();
      return;
    }
  });

  // restart
  document.getElementById('btnRestart')?.addEventListener('click', function () {
    // reset fields
    form.reset();
    resultSummary.style.display = 'none';
    resultBreakdown.innerHTML = '';
    resultTotal.innerText = '';
    resultNote.innerText = '';
    showStep(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  function handleNext() {
    // validate current input (non-negative number or empty)
    const cur = steps[currentStep];
    const input = cur.querySelector('.survey-input');
    const err = cur.querySelector('.survey-error');
    if (input) {
      const val = input.value;
      if (val === '' || (/^\d*\.?\d*$/.test(val) && parseFloat(val) >= 0)) {
        // ok: treat empty as 0
        err.style.display = 'none';
        // if last input step -> hesapla
        if (currentStep === 19) {
          // tüm formu hesapla
          calculateAndShow();
          showStep(20); // result step index 20
          return;
        }
        showStep(currentStep + 1);
        return;
      } else {
        // invalid
        err.style.display = 'block';
        return;
      }
    } else {
      // if no input (shouldn't happen), go next
      if (currentStep === 19) {
        calculateAndShow();
        showStep(20);
        return;
      }
      showStep(currentStep + 1);
    }
  }

  function handlePrev() {
    // if we're at result block (20) go to last input (19)
    if (currentStep === 20) {
      showStep(19);
      return;
    }
    showStep(currentStep - 1);
  }

  // ====== 3) Calculation ======
  function readNumber(id) {
    const el = document.getElementById(id);
    if (!el) return 0;
    const v = el.value;
    if (v === '') return 0;
    const n = Number(v);
    return isFinite(n) ? n : 0;
  }

  function calculateAndShow() {
    // read answers (units as per form)
    const answers = {
      electricity_kWh: readNumber('q-electricity'),
      renewable_kWh: readNumber('q-renewable'),
      naturalGas_m3: readNumber('q-naturalgas'),
      lpg_l: readNumber('q-lpg'),
      fuelOil_l: readNumber('q-fueloil'),
      coal_ton: readNumber('q-coal'),
      centralHeat_kWh: readNumber('q-centralheat'),
      flights_count: readNumber('q-flights'),
      car_km: readNumber('q-car-km'),
      van_km: readNumber('q-van-km'),
      truck_km: readNumber('q-truck-km'),
      service_km: readNumber('q-service-km'),
      bus_km: readNumber('q-bus-km'),
      metro_km: readNumber('q-metro-km'),
      taxi_km: readNumber('q-taxi-km'),
      a4_count: readNumber('q-a4-count'),
      cardboard_count: readNumber('q-cardboard'),
      water_m3: readNumber('q-water'),
      waste_nonrec_kg: readNumber('q-waste-nonrec'),
      waste_rec_kg: readNumber('q-waste-rec')
    };

    // compute contributions (kg CO2e)
    const contributions = {};

    // electricity: subtract renewables from total electricity (if desired)
    const netElectricity = Math.max(0, answers.electricity_kWh - answers.renewable_kWh);

    contributions.electricity = netElectricity * EMISSION_FACTORS.electricity_kWh;
    contributions.renewable = answers.renewable_kWh * (EMISSION_FACTORS.renewable_kWh ?? 0);

    contributions.naturalGas = answers.naturalGas_m3 * EMISSION_FACTORS.naturalGas_m3;
    contributions.lpg = answers.lpg_l * EMISSION_FACTORS.lpg_l;
    contributions.fuelOil = answers.fuelOil_l * EMISSION_FACTORS.fuelOil_l;
    contributions.coal = answers.coal_ton * EMISSION_FACTORS.coal_ton; // coal ton -> factor must be per ton
    contributions.centralHeat = answers.centralHeat_kWh * EMISSION_FACTORS.centralHeat_kWh;

    contributions.flights = answers.flights_count * EMISSION_FACTORS.flight_each;

    contributions.car = answers.car_km * EMISSION_FACTORS.car_km;
    contributions.van = answers.van_km * EMISSION_FACTORS.van_km;
    contributions.truck = answers.truck_km * EMISSION_FACTORS.truck_km;
    contributions.service = answers.service_km * EMISSION_FACTORS.service_km;
    contributions.bus = answers.bus_km * EMISSION_FACTORS.bus_km;
    contributions.metro = answers.metro_km * EMISSION_FACTORS.metro_km;
    contributions.taxi = answers.taxi_km * EMISSION_FACTORS.taxi_km;

    contributions.paper = answers.a4_count * EMISSION_FACTORS.paper_per_sheet;
    contributions.cardboard = answers.cardboard_count * EMISSION_FACTORS.cardboard_per_unit;

    // optional
    contributions.water = answers.water_m3 * EMISSION_FACTORS.water_m3;
    contributions.waste_nonrec = answers.waste_nonrec_kg * EMISSION_FACTORS.waste_nonrec_kg;
    contributions.waste_rec = answers.waste_rec_kg * EMISSION_FACTORS.waste_rec_kg;

    // sum
    let totalKg = 0;
    Object.keys(contributions).forEach(k => {
      const num = Number(contributions[k]) || 0;
      totalKg += num;
    });

    // build UI
    resultBreakdown.innerHTML = ''; // clear
    Object.entries(contributions).forEach(([k, v]) => {
      // only show if contribution > 0.1 kg
      if (v && Math.abs(v) > 0.0001) {
        const li = document.createElement('li');
        li.innerText = `${humanKey(k)}: ${formatNumber(v)} kg CO₂e`;
        resultBreakdown.appendChild(li);
      }
    });

    resultTotal.innerText = `Toplam: ${formatNumber(totalKg / 1000)} ton CO₂e (${formatNumber(totalKg)} kg)`;
    resultNote.innerText = `Not: Hesaplama için kullanılan katsayıları TÜİK verileriyle güncelleyin. (EMISSION_FACTORS objesi)`;
    resultSummary.style.display = 'block';

    // scroll to result
    resultSummary.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function humanKey(k) {
    const mapping = {
      electricity: 'Elektrik (net)',
      renewable: 'Yenilenebilir elektrik',
      naturalGas: 'Doğal gaz',
      lpg: 'LPG',
      fuelOil: 'Kızgın yağ / Fuel oil',
      coal: 'Kömür',
      centralHeat: 'Merkezi ısıtma',
      flights: 'Uçuşlar',
      car: 'Otomobil (km)',
      van: 'Kamyonet (km)',
      truck: 'Kamyon (km)',
      service: 'Personel servisi (km)',
      bus: 'Toplu taşıma - Otobüs (km)',
      metro: 'Metro (km)',
      taxi: 'Taksi (km)',
      paper: 'A4 kağıt',
      cardboard: 'Karton kutu',
      water: 'Su tüketimi',
      waste_nonrec: 'Geri dönüştürülmeyen atık',
      waste_rec: 'Geri dönüştürülen atık'
    };
    return mapping[k] || k;
  }

  function formatNumber(n) {
    return Number(n).toLocaleString('tr-TR', { maximumFractionDigits: 2 });
  }

  // initialize
  showStep(0);
  // expose for debugging
  window._carbonSurvey = { EMISSION_FACTORS, calculateAndShow };
});

document.addEventListener('DOMContentLoaded', function () {
  const steps = document.querySelectorAll('.survey-step');
  const progressFill = document.getElementById('surveyProgressFill');
  const progressPercent = document.getElementById('surveyProgressPercent');
  let currentStep = 0;

  function updateProgress() {
    const percent = Math.round(((currentStep + 1) / steps.length) * 100);
    progressFill.style.width = percent + '%';
    progressPercent.textContent = percent + '%';
  }

  function showStep(nextStep, direction) {
    if (nextStep < 0 || nextStep >= steps.length) return;

    const currentEl = steps[currentStep];
    const nextEl = steps[nextStep];

    // Animasyon yönü
    if (direction === 'next') {
      currentEl.classList.add('slide-out-left');
      nextEl.classList.add('slide-in-right');
    } else {
      currentEl.classList.add('slide-out-right');
      nextEl.classList.add('slide-in-left');
    }

    nextEl.style.display = 'block';

    // Animasyon bitince aktif değişimi
    setTimeout(() => {
      currentEl.classList.remove('active', 'slide-out-left', 'slide-out-right');
      currentEl.style.display = 'none';
      nextEl.classList.remove('slide-in-right', 'slide-in-left');
      nextEl.classList.add('active');
      currentStep = nextStep;
      updateProgress();
    }, 350);
  }

  document.querySelectorAll('.btn-next').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = steps[currentStep].querySelector('.survey-input');
      const error = steps[currentStep].querySelector('.survey-error');
      if (input && input.value.trim() === '') {
        error.style.display = 'block';
        return;
      }
      error.style.display = 'none';
      showStep(currentStep + 1, 'next');
    });
  });

  document.querySelectorAll('.btn-back').forEach(btn => {
    btn.addEventListener('click', () => {
      showStep(currentStep - 1, 'prev');
    });
  });

  updateProgress();
});
