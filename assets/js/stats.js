(function () {
  const DATA_URL = "data/activity.jsonl";
  const BLOCK_COUNT = 5;

  function fmt(n) {
    return n.toLocaleString("en-US");
  }

  function parseJSONL(text) {
    return text
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  }

  function renderDiffBlocks(container, ins, del) {
    container.innerHTML = "";
    const total = ins + del || 1;
    const addBlocks = Math.round((ins / total) * BLOCK_COUNT);
    const delBlocks = BLOCK_COUNT - addBlocks;
    for (let i = 0; i < addBlocks; i++) {
      const b = document.createElement("span");
      b.className = "diffstat-block add";
      container.appendChild(b);
    }
    for (let i = 0; i < delBlocks; i++) {
      const b = document.createElement("span");
      b.className = "diffstat-block del";
      container.appendChild(b);
    }
  }

  function renderChart(canvas, entries, colleagueData) {
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const W = rect.width;
    const H = rect.height;
    const PAD = { top: 20, right: 20, bottom: 30, left: 60 };

    const byDay = {};
    entries.forEach((e) => {
      const day = e.ts.slice(0, 10);
      byDay[day] = (byDay[day] || 0) + (e.ins || 0);
    });

    const days = Object.keys(byDay).sort();
    if (days.length === 0) {
      ctx.fillStyle = "#666";
      ctx.font = "14px Inter, sans-serif";
      ctx.fillText("No data yet — commits will appear here.", PAD.left, H / 2);
      return;
    }

    let cumMe = [];
    let runMe = 0;
    days.forEach((d) => {
      runMe += byDay[d];
      cumMe.push({ day: d, val: runMe });
    });

    let cumColleague = [];
    if (colleagueData) {
      let runCol = 0;
      days.forEach((d) => {
        runCol += colleagueData[d] || 0;
        cumColleague.push({ day: d, val: runCol });
      });
    }

    const allVals = cumMe.map((d) => d.val).concat(cumColleague.map((d) => d.val));
    const maxVal = Math.max(...allVals, 1);
    const plotW = W - PAD.left - PAD.right;
    const plotH = H - PAD.top - PAD.bottom;

    function x(i) {
      return PAD.left + (i / Math.max(days.length - 1, 1)) * plotW;
    }
    function y(v) {
      return PAD.top + plotH - (v / maxVal) * plotH;
    }

    // Grid lines
    ctx.strokeStyle = "#e1e4e8";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const yy = PAD.top + (plotH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(PAD.left, yy);
      ctx.lineTo(W - PAD.right, yy);
      ctx.stroke();
    }

    // Y-axis labels
    ctx.fillStyle = "#666";
    ctx.font = "11px Inter, sans-serif";
    ctx.textAlign = "right";
    for (let i = 0; i <= 4; i++) {
      const val = Math.round((maxVal / 4) * (4 - i));
      const yy = PAD.top + (plotH / 4) * i;
      ctx.fillText(fmt(val), PAD.left - 8, yy + 4);
    }

    // X-axis labels
    ctx.textAlign = "center";
    const labelCount = Math.min(days.length, 6);
    for (let i = 0; i < labelCount; i++) {
      const idx = Math.round((i / Math.max(labelCount - 1, 1)) * (days.length - 1));
      const d = days[idx];
      ctx.fillText(d.slice(5), x(idx), H - 8);
    }

    function drawLine(data, color) {
      if (data.length === 0) return;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = "round";
      ctx.beginPath();
      data.forEach((d, i) => {
        const px = x(i);
        const py = y(d.val);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
    }

    if (cumColleague.length > 0) drawLine(cumColleague, "#8b949e");
    drawLine(cumMe, "#2da44e");
  }

  fetch(DATA_URL)
    .then((r) => (r.ok ? r.text() : ""))
    .then((text) => {
      const entries = text ? parseJSONL(text) : [];

      let totalIns = 0;
      let totalDel = 0;
      let totalFiles = 0;
      entries.forEach((e) => {
        totalIns += e.ins || 0;
        totalDel += e.del || 0;
        totalFiles += e.files || 0;
      });

      document.getElementById("stat-commits").textContent = fmt(entries.length);
      document.getElementById("stat-files").textContent = fmt(totalFiles);
      document.getElementById("diffstat-add").textContent = "+" + fmt(totalIns);
      document.getElementById("diffstat-del").textContent = "-" + fmt(totalDel);
      renderDiffBlocks(document.getElementById("diffstat-blocks"), totalIns, totalDel);

      // Colleague comparison data can be seeded in data/colleague.json
      fetch("data/colleague.json")
        .then((r) => (r.ok ? r.json() : null))
        .then((colData) => {
          renderChart(document.getElementById("stats-chart"), entries, colData);
        })
        .catch(() => {
          renderChart(document.getElementById("stats-chart"), entries, null);
        });
    })
    .catch(() => {
      document.getElementById("stat-commits").textContent = "0";
      document.getElementById("stat-files").textContent = "0";
    });
})();
