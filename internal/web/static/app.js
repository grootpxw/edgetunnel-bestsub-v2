const configView = document.querySelector("#configView");
const resultRows = document.querySelector("#resultRows");
const runBtn = document.querySelector("#runBtn");
const clashBtn = document.querySelector("#clashBtn");
const pushBtn = document.querySelector("#pushBtn");
const proxyPushBtn = document.querySelector("#proxyPushBtn");
const checkBtn = document.querySelector("#checkBtn");
const envSummary = document.querySelector("#envSummary");
const envChecks = document.querySelector("#envChecks");
const envPanel = document.querySelector("#envPanel");
const countrySelect = document.querySelector("#countrySelect");
const clearCountryBtn = document.querySelector("#clearCountryBtn");
const modeToggle = document.querySelector("#modeToggle");
const loadingOverlay = document.querySelector("#loadingOverlay");
const loadingText = document.querySelector("#loadingText");
const proxyipSummary = document.querySelector("#proxyipSummary");
const proxyipFetchBtn = document.querySelector("#proxyipFetchBtn");
const proxyipDropdown = document.querySelector("#proxyipDropdown");
const proxyipDropdownTrigger = document.querySelector("#proxyipDropdownTrigger");
const proxyipDropdownLabel = document.querySelector("#proxyipDropdownLabel");
const proxyipDropdownMenu = document.querySelector("#proxyipDropdownMenu");
let proxyipSelectedCountry = "US";

const editConfigBtn = document.querySelector("#editConfigBtn");
const saveConfigBtn = document.querySelector("#saveConfigBtn");
const cancelConfigBtn = document.querySelector("#cancelConfigBtn");

const progressContainer = document.querySelector("#progressContainer");
const progressBarFill = document.querySelector("#progressBarFill");
const progressPercent = document.querySelector("#progressPercent");
const progressStatus = document.querySelector("#progressStatus");

const modalOverlay = document.querySelector("#modalOverlay");
const modalTitle = document.querySelector("#modalTitle");
const modalMessage = document.querySelector("#modalMessage");
const modalIcon = document.querySelector("#modalIcon");
const modalOkBtn = document.querySelector("#modalOkBtn");

let lastPreflight = null;
let progressInterval = null;
let simulatedProgress = 0;
let clashReady = false;
let latestAutoProxyIPs = "";
let isFetchingProxyIP = false; // 标记是否正在优选反代 IP
let isEditingConfig = false; // 标记是否正在编辑配置
let originalConfig = null; // 保存原始配置

function getFlagEmoji(countryCode) {
  if (!countryCode || countryCode.length !== 2) return "";
  const code = countryCode.toUpperCase();
  if (code === "TW") return "🇹🇼";
  if (code === "HK") return "🇭🇰";
  return code.replace(/./g, char => 
    String.fromCodePoint(char.charCodeAt(0) + 127397)
  );
}

const countryOptions = [
  ["JP", "日本", "Japan"], ["SG", "新加坡", "Singapore"], ["HK", "香港", "Hong Kong"],
  ["TW", "台湾", "Taiwan"], ["KR", "韩国", "Korea"],
  ["US", "美国", "United States"], ["CA", "加拿大", "Canada"], ["GB", "英国", "United Kingdom"],
  ["DE", "德国", "Germany"], ["FR", "法国", "France"],
  ["NL", "荷兰", "Netherlands"], ["ES", "西班牙", "Spain"], ["IT", "意大利", "Italy"],
  ["AU", "澳大利亚", "Australia"], ["NZ", "新西兰", "New Zealand"],
  ["TH", "泰国", "Thailand"], ["MY", "马来西亚", "Malaysia"], ["PH", "菲律宾", "Philippines"],
  ["ID", "印尼", "Indonesia"], ["VN", "越南", "Vietnam"],
  ["IN", "印度", "India"], ["BR", "巴西", "Brazil"], ["MX", "墨西哥", "Mexico"],
  ["ZA", "南非", "South Africa"], ["AE", "阿联酋", "UAE"]
];

const SVGS = {
  info: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
  success: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  error: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
  warning: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
};

async function getJSON(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

function setDL(node, rows) {
  node.innerHTML = rows.map(([key, value]) => `
    <dt>${escapeHTML(key)}</dt>
    <dd>${value instanceof HTMLElement ? value.outerHTML : escapeHTML(String(value ?? ""))}</dd>
  `).join("");
}

function escapeHTML(value) {
  if (value && value.startsWith("<span")) return value;
  return value.replace(/[&<>"']/g, ch => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[ch]));
}

function translateError(msg) {
  if (msg.includes("Failed to fetch")) return "无法连接到服务器，请检查程序是否启动。";
  if (msg.includes("NetworkError")) return "网络请求失败。";
  if (msg.includes("selectedMode is not defined")) return "程序内部逻辑错误（模式选择未定义）。";
  if (msg.includes("no candidates loaded")) return "未加载到候选 IP，请检查网络（如 GitHub 访问）或配置文件中的 Sources。";
  return msg;
}

function showAlert(message, title = "提示", type = "info") {
  return new Promise((resolve) => {
    modalTitle.textContent = title;
    modalMessage.textContent = translateError(message);

    const colorMap = {
      info: { main: "#0071e3", bg: "rgba(0, 113, 227, 0.1)" },
      success: { main: "#34c759", bg: "rgba(52, 199, 89, 0.1)" },
      error: { main: "#ff3b30", bg: "rgba(255, 59, 48, 0.1)" },
      warning: { main: "#ff9500", bg: "rgba(255, 149, 0, 0.1)" }
    };

    const colors = colorMap[type] || colorMap.info;
    const svg = SVGS[type] || SVGS.info;

    modalIcon.innerHTML = svg;
    modalIcon.style.color = colors.main;
    modalIcon.style.backgroundColor = colors.bg;

    modalOverlay.classList.remove("hidden");

    // 移除旧的事件监听器，添加新的
    const handleClose = () => {
      modalOverlay.classList.add("hidden");
      modalOkBtn.removeEventListener("click", handleClose);
      resolve();
    };

    modalOkBtn.addEventListener("click", handleClose);
  });
}

async function loadConfig() {
  const data = await getJSON("/api/config");
  const cfg = data.config;
  originalConfig = cfg; // 保存原始配置
  clashReady = Boolean(cfg.clash?.local_profile_dir);
  clashBtn.title = clashReady ? "生成并写入 Clash Verge profiles 目录" : "请先在 config.yaml 配置 clash.local_profile_dir";
  renderCountryOptions(cfg.probe.countries || []);
  renderProxyIPCountrySelect(cfg.clash?.proxyip_auto?.country || "US");

  renderConfigView(cfg, data.config_path);
}

function renderConfigView(cfg, configPath) {
  if (isEditingConfig) {
    // 编辑模式：手动构建 DOM
    configView.innerHTML = '';

    const items = [
      { label: "Worker 地址", value: cfg.worker.base_url, editable: true, id: "input-worker-url", type: "text" },
      { label: "Worker 密码", value: cfg.worker.password, editable: true, id: "input-worker-password", type: "password" },
      { label: "测速 URL", value: cfg.probe.target.url, editable: true, id: "input-probe-url", type: "text" },
      { label: "保留数量", value: cfg.probe.keep, editable: true, id: "input-keep", type: "number", min: 1, max: 100 },
      { label: "并发数", value: cfg.probe.concurrency, editable: true, id: "input-concurrency", type: "number", min: 1, max: 500 },
      { label: "超时时间(ms)", value: cfg.probe.timeout_ms, editable: true, id: "input-timeout", type: "number", min: 100, max: 30000 },
      { label: "端口", value: cfg.probe.ports.join(", "), editable: false },
      { label: "Clash 目录", value: cfg.clash?.local_profile_dir || "", editable: true, id: "input-clash-dir", type: "text", placeholder: "例如: C:/Users/xxx/AppData/Roaming/io.github.clash-verge-rev.clash-verge-rev/profiles" },
      { label: "Clash Host", value: cfg.clash?.host || "", editable: true, id: "input-clash-host", type: "text" },
      { label: "Clash UUID", value: cfg.clash?.uuid || "", editable: true, id: "input-clash-uuid", type: "text" },
      { label: "Dry run", value: cfg.output.dry_run, editable: false }
    ];

    items.forEach(item => {
      const dt = document.createElement('dt');
      dt.textContent = item.label;

      const dd = document.createElement('dd');
      if (item.editable) {
        // 如果是密码类型，创建带切换按钮的包装器
        if (item.type === 'password') {
          const wrapper = document.createElement('div');
          wrapper.className = 'password-input-wrapper';

          const input = document.createElement('input');
          input.type = 'password';
          input.className = 'config-input';
          input.id = item.id;
          input.value = item.value;

          const toggleBtn = document.createElement('button');
          toggleBtn.type = 'button';
          toggleBtn.className = 'password-toggle-btn';
          toggleBtn.innerHTML = '<i data-lucide="eye"></i>';
          toggleBtn.title = '显示/隐藏密码';

          toggleBtn.addEventListener('click', () => {
            if (input.type === 'password') {
              input.type = 'text';
              toggleBtn.innerHTML = '<i data-lucide="eye-off"></i>';
            } else {
              input.type = 'password';
              toggleBtn.innerHTML = '<i data-lucide="eye"></i>';
            }
            lucide.createIcons();
          });

          wrapper.appendChild(input);
          wrapper.appendChild(toggleBtn);
          dd.appendChild(wrapper);
        } else {
          // 普通输入框
          const input = document.createElement('input');
          input.type = item.type || 'text';
          input.className = 'config-input';
          input.id = item.id;
          input.value = item.value;
          if (item.min !== undefined) input.min = item.min;
          if (item.max !== undefined) input.max = item.max;
          if (item.placeholder) input.placeholder = item.placeholder;
          dd.appendChild(input);
        }
      } else {
        dd.textContent = item.value;
      }

      configView.appendChild(dt);
      configView.appendChild(dd);
    });

    // 初始化 Lucide 图标
    lucide.createIcons();
  } else {
    // 查看模式：显示文本
    setDL(configView, [
      ["Worker 地址", cfg.worker.base_url],
      ["Worker 密码", "••••••••"],
      ["测速 URL", cfg.probe.target.url],
      ["保留数量", cfg.probe.keep],
      ["并发数", cfg.probe.concurrency],
      ["超时时间(ms)", cfg.probe.timeout_ms],
      ["端口", cfg.probe.ports.join(", ")],
      ["Clash 目录", cfg.clash?.local_profile_dir || "未配置"],
      ["Clash Host", cfg.clash?.host || "未配置"],
      ["Clash UUID", cfg.clash?.uuid || "未配置"],
      ["Dry run", cfg.output.dry_run]
    ]);
  }
}

async function refresh() {
  const status = await getJSON("/api/status");
  runBtn.disabled = status.running;
  clashBtn.disabled = status.running || !status.has_result || !clashReady;
  pushBtn.disabled = status.running || !status.has_result;
  proxyPushBtn.disabled = status.running || !latestAutoProxyIPs;
  setLoading(status.running, status.last_error, status.has_result, status);

  if (status.has_result) {
    const latest = await getJSON("/api/results/latest");
    latestAutoProxyIPs = latest.auto_proxy_ips || "";
    proxyPushBtn.disabled = status.running || !latestAutoProxyIPs;
    renderProxyIPSummary(latestAutoProxyIPs);
    if (latest.top && latest.top.length === 0 && status.last_success > 0) {
      // Logic for filtered out but found IPs
      progressStatus.textContent = `找到了 ${status.last_success} 个有效 IP，但都不符合国家筛选条件。`;
    }
    resultRows.innerHTML = (latest.top || []).map(row => `
      <tr>
        <td>${escapeHTML(row.ip)}</td>
        <td>${row.port}</td>
        <td>${row.total_ms}ms</td>
        <td>${escapeHTML(row.colo || "")}</td>
        <td>${escapeHTML(countryDisplay(row))}</td>
        <td>${row.status_code}</td>
        <td>${escapeHTML(row.source || "")}</td>
      </tr>
    `).join("");
  }
}

function renderProxyIPSummary(value) {
  // 如果正在优选反代 IP，不更新显示
  if (isFetchingProxyIP) {
    return;
  }

  if (!value) {
    proxyipSummary.className = "proxyip-summary muted";
    proxyipSummary.textContent = "暂无反代优选结果。点击优选反代 IP 后，这里会显示可推送的 PROXYIP。";
    return;
  }
  const items = value.split(",").map(item => item.trim()).filter(Boolean);
  proxyipSummary.className = "proxyip-summary";
  proxyipSummary.innerHTML = `
    <div class="proxyip-count">已筛出 ${items.length} 个 PROXYIP</div>
    <div class="proxyip-list">${items.map(item => `<code>${escapeHTML(item)}</code>`).join("")}</div>
  `;
}

async function start() {
  const report = await checkEnvironment();
  if (report.blocked) {
    await showAlert("环境检测未通过。请关闭代理后再测速。", "环境异常", "error");
    return;
  }

  const countries = selectedCountries();
  if (countries.length === 0) {
    await showAlert("请至少选择一个国家后再开始测速。", "提醒", "warning");
    return;
  }

  try {
    await getJSON("/api/config/update", {
      method: "POST",
      body: JSON.stringify({ countries })
    });
    await loadConfig();
  } catch (err) {
    console.error("Save config failed:", err);
  }

  const mode = selectedMode();
  const params = new URLSearchParams();
  params.set("mode", mode);
  params.set("countries", countries.join(","));
  
  simulatedProgress = 0;
  await getJSON(`/api/probe/run?${params.toString()}`, { method: "POST" });
  await refresh();
}

async function push() {
  pushBtn.disabled = true;
  try {
    const result = await getJSON("/api/worker/push", { method: "POST" });
    if (result.success) {
      await showAlert("测速结果已成功同步至远程 Worker。", "推送成功", "success");
    }
  } catch (err) {
    await showAlert("同步失败: " + err.message, "错误", "error");
  } finally {
    await refresh();
  }
}

async function pushProxyIP() {
  proxyPushBtn.disabled = true;
  try {
    const result = await getJSON("/api/worker/proxyip", { method: "POST" });
    if (result.success) {
      await showAlert(`PROXYIP 已推送到 Worker：${result.proxy_ip}`, "推送成功", "success");
    }
  } catch (err) {
    await showAlert("PROXYIP 推送失败: " + err.message, "错误", "error");
  } finally {
    await refresh();
  }
}

async function fetchProxyIPOnly() {
  isFetchingProxyIP = true;
  proxyipFetchBtn.disabled = true;
  proxyipSummary.className = "proxyip-summary muted";
  proxyipSummary.innerHTML = '<span>🔄 正在优选反代 IP，请稍候...</span>';

  // 先检测环境
  const report = await checkEnvironment();
  if (report.blocked) {
    await showAlert("环境检测未通过。请关闭代理后再优选反代 IP。", "环境异常", "error");
    proxyipFetchBtn.disabled = false;
    isFetchingProxyIP = false;
    await refresh();
    return;
  }

  try {
    await getJSON("/api/proxyip/fetch?country=" + encodeURIComponent(proxyipSelectedCountry), { method: "POST" });

    // 轮询等待完成
    let attempts = 0;
    let dots = 0;
    while (attempts < 120) {
      await new Promise(r => setTimeout(r, 2000));

      // 更新加载动画
      dots = (dots + 1) % 4;
      const dotStr = '.'.repeat(dots);
      proxyipSummary.innerHTML = `<span>🔄 正在优选反代 IP${dotStr}</span>`;

      const status = await getJSON("/api/status");
      if (!status.running) {
        if (status.last_error) {
          await showAlert("反代 IP 优选失败: " + status.last_error, "错误", "error");
        } else {
          await showAlert("反代 IP 优选完成！", "成功", "success");
        }
        break;
      }
      attempts++;
    }

    if (attempts >= 120) {
      await showAlert("反代 IP 优选超时，请重试。", "超时", "warning");
    }
  } catch (err) {
    await showAlert("反代 IP 优选失败: " + err.message, "错误", "error");
  } finally {
    isFetchingProxyIP = false;
    proxyipFetchBtn.disabled = false;
    await refresh();
  }
}

async function generateClash() {
  if (!clashReady) {
    await showAlert("请先在 config.yaml 配置 clash.local_profile_dir 后重启程序。", "未配置 Clash 目录", "warning");
    return;
  }
  clashBtn.disabled = true;
  try {
    const result = await getJSON("/api/clash/generate", { method: "POST" });
    const suffix = result.registered ? "，并已注册到 Clash Verge 配置列表" : "";
    await showAlert(`已生成 ${result.nodes} 个节点${suffix}：${result.path}`, "生成成功", "success");
  } catch (err) {
    await showAlert("生成失败: " + err.message, "错误", "error");
  } finally {
    await refresh();
  }
}

function enterEditMode() {
  isEditingConfig = true;
  editConfigBtn.classList.add("hidden");
  saveConfigBtn.classList.remove("hidden");
  cancelConfigBtn.classList.remove("hidden");

  // 重新渲染配置视图为编辑模式
  const data = { config_path: "configs/config.yaml" };
  renderConfigView(originalConfig, data.config_path);
}

function exitEditMode() {
  isEditingConfig = false;
  editConfigBtn.classList.remove("hidden");
  saveConfigBtn.classList.add("hidden");
  cancelConfigBtn.classList.add("hidden");

  // 重新渲染配置视图为查看模式
  const data = { config_path: "configs/config.yaml" };
  renderConfigView(originalConfig, data.config_path);
}

async function saveConfigChanges() {
  // 收集输入框的值
  const updates = {
    "worker.base_url": document.querySelector("#input-worker-url")?.value,
    "worker.password": document.querySelector("#input-worker-password")?.value,
    "probe.target.url": document.querySelector("#input-probe-url")?.value,
    "probe.keep": parseInt(document.querySelector("#input-keep")?.value),
    "probe.concurrency": parseInt(document.querySelector("#input-concurrency")?.value),
    "probe.timeout_ms": parseInt(document.querySelector("#input-timeout")?.value),
    "clash.local_profile_dir": document.querySelector("#input-clash-dir")?.value,
    "clash.host": document.querySelector("#input-clash-host")?.value,
    "clash.uuid": document.querySelector("#input-clash-uuid")?.value
  };

  // 验证输入
  if (!updates["worker.base_url"] || !updates["probe.target.url"]) {
    await showAlert("请填写所有必填字段。", "验证失败", "warning");
    return;
  }

  if (updates["probe.keep"] < 1 || updates["probe.keep"] > 100) {
    await showAlert("保留数量必须在 1-100 之间。", "验证失败", "warning");
    return;
  }

  if (updates["probe.concurrency"] < 1 || updates["probe.concurrency"] > 500) {
    await showAlert("并发数必须在 1-500 之间。", "验证失败", "warning");
    return;
  }

  if (updates["probe.timeout_ms"] < 100 || updates["probe.timeout_ms"] > 30000) {
    await showAlert("超时时间必须在 100-30000ms 之间。", "验证失败", "warning");
    return;
  }

  saveConfigBtn.disabled = true;
  try {
    await getJSON("/api/config/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates)
    });

    await showAlert("配置已保存成功！", "保存成功", "success");
    exitEditMode();
    await loadConfig();
    await refresh(); // 刷新状态，更新按钮可用性
  } catch (err) {
    await showAlert("保存失败: " + err.message, "错误", "error");
  } finally {
    saveConfigBtn.disabled = false;
  }
}

function selectedMode() {
  return modeToggle.querySelector(".mode-option.selected")?.dataset.mode || "quick";
}

function setLoading(running, lastError, hasResult, statusData) {
  loadingOverlay.classList.toggle("hidden", !running);
  
  if (running) {
    progressContainer.className = "progress-system running";
    if (!progressInterval) {
      const mode = selectedMode();
      const duration = mode === "stable" ? 180 : 20;
      progressInterval = setInterval(() => {
        if (simulatedProgress < 98) {
          simulatedProgress += (100 / (duration * 10));
          updateProgress(simulatedProgress, "Loading...");
        }
      }, 100);
    }
    loadingText.textContent = "测速任务运行中...";
  } else {
    if (progressInterval) {
      clearInterval(progressInterval);
      progressInterval = null;
    }
    if (lastError) {
      progressContainer.className = "progress-system error";
      updateProgress(100, "Error!");
      progressStatus.textContent = translateError(lastError);
    } else if (hasResult) {
      progressContainer.className = "progress-system success";
      updateProgress(100, "Completed!");
      if (statusData && statusData.last_success === 0) {
        progressStatus.innerHTML = `扫描了 <strong class="result-count muted">${statusData.last_candidates}</strong> 个候选 IP，但没有一个测速成功。`;
      } else {
        progressStatus.innerHTML = `测速完成，共发现 <strong class="result-count">${statusData?.last_success || 0}</strong> 个有效 IP。`;
      }
    } else {
      progressContainer.className = "progress-system";
      updateProgress(0, "Ready");
    }
  }
}

function updateProgress(percent, status) {
  const p = Math.min(Math.max(percent, 0), 100);
  progressBarFill.style.width = `${p}%`;
  progressPercent.textContent = `${Math.floor(p)} %`;
  progressStatus.textContent = status;
}

function renderCountryOptions(selected) {
  const selectedSet = new Set(selected);
  const currentLang = document.documentElement.getAttribute('lang') || 'zh';
  countrySelect.innerHTML = countryOptions.map(([code, nameZh, nameEn]) => {
    const displayName = currentLang === 'zh' ? nameZh : nameEn;
    return `<button type="button" class="country-chip ${selectedSet.has(code) ? "selected" : ""}" data-code="${code}" aria-pressed="${selectedSet.has(code) ? "true" : "false"}">
      <span class="flag">${getFlagEmoji(code)}</span>
      <span>${displayName}</span>
      <span class="code">${code}</span>
    </button>`;
  }).join("");
}

function renderProxyIPCountrySelect(current) {
  proxyipSelectedCountry = current || "US";
  const currentLang = document.documentElement.getAttribute('lang') || 'zh';
  const match = countryOptions.find(([code]) => code === proxyipSelectedCountry);
  if (match) {
    const displayName = currentLang === 'zh' ? match[1] : match[2];
    proxyipDropdownLabel.textContent = `${getFlagEmoji(match[0])} ${displayName} (${match[0]})`;
  }
  proxyipDropdownMenu.innerHTML = countryOptions.map(([code, nameZh, nameEn]) => {
    const displayName = currentLang === 'zh' ? nameZh : nameEn;
    return `<div class="proxyip-dropdown-item ${code === proxyipSelectedCountry ? "selected" : ""}" data-code="${code}">
      <span>${getFlagEmoji(code)}</span>
      <span>${displayName} (${code})</span>
    </div>`;
  }).join("");
}

function selectedCountries() {
  return Array.from(countrySelect.querySelectorAll(".country-chip.selected")).map(button => button.dataset.code);
}

function countryDisplay(row) {
  if (row.country_code) {
    const flag = getFlagEmoji(row.country_code);
    const name = row.country_name || "";
    // Simplified name: Chinese + (ISO)
    return `${flag} ${name} (${row.country_code})`;
  }
  return "未知";
}

async function checkEnvironment() {
  checkBtn.disabled = true;
  envPanel.className = "panel env-panel pending";
  envSummary.className = "env-summary pending";
  envSummary.innerHTML = `<span>检测中...</span>`;
  try {
    const report = await getJSON("/api/preflight", { method: "POST" });
    lastPreflight = report;
    renderEnvironment(report);
    return report;
  } finally {
    checkBtn.disabled = false;
  }
}

function renderEnvironment(report) {
  envPanel.className = `panel env-panel ${report.blocked ? "blocked" : "ok"}`;
  envSummary.className = `env-summary ${report.blocked ? "blocked" : "ok"}`;
  const summary = report.blocked
    ? "检测到代理或异常低延迟信号，已阻止测速。"
    : "环境检测通过，可以开始测速。";
  envSummary.innerHTML = `<span>${escapeHTML(summary)}</span>`;
  
  let html = report.checks.map(check => `
    <li class="${escapeHTML(check.severity)}">
      <strong>${escapeHTML(check.name)} <em class="badge ${escapeHTML(check.severity)}">${severityLabel(check.severity)}</em></strong>
      <span>${escapeHTML(check.message)}</span>
    </li>
  `).join("");

  if (report.sample && report.sample.length > 0) {
    const sampleHtml = report.sample.map(s => `
      <div style="font-size:12px; color:var(--text-secondary); margin-top:4px; display:flex; justify-content:space-between;">
        <span>${s.ip}</span>
        <span>${s.success ? `${s.total_ms}ms (${s.colo})` : `<span style="color:var(--danger)">失败</span>`}</span>
      </div>
    `).join("");
    html += `<li style="display:block;"><strong>抽样详情</strong><div style="margin-top:8px;">${sampleHtml}</div></li>`;
  }

  envChecks.innerHTML = html;
}

function severityLabel(severity) {
  return {
    block: "阻止",
    warn: "注意",
    info: "通过"
  }[severity] || severity;
}

runBtn.addEventListener("click", () => start().catch(err => showAlert(err.message, "执行失败", "error")));
clashBtn.addEventListener("click", () => generateClash().catch(err => showAlert(err.message, "执行失败", "error")));
pushBtn.addEventListener("click", () => push().catch(err => showAlert(err.message, "执行失败", "error")));
proxyPushBtn.addEventListener("click", () => pushProxyIP().catch(err => showAlert(err.message, "执行失败", "error")));
proxyipFetchBtn.addEventListener("click", () => fetchProxyIPOnly().catch(err => showAlert(err.message, "执行失败", "error")));

// Config edit buttons
editConfigBtn.addEventListener("click", enterEditMode);
saveConfigBtn.addEventListener("click", () => saveConfigChanges().catch(err => showAlert(err.message, "保存失败", "error")));
cancelConfigBtn.addEventListener("click", exitEditMode);

// ProxyIP country dropdown
proxyipDropdownTrigger.addEventListener("click", (e) => {
  e.stopPropagation();
  proxyipDropdownMenu.classList.toggle("hidden");
});
proxyipDropdownMenu.addEventListener("click", (e) => {
  const item = e.target.closest(".proxyip-dropdown-item");
  if (!item) return;
  proxyipSelectedCountry = item.dataset.code;
  renderProxyIPCountrySelect(proxyipSelectedCountry);
  proxyipDropdownMenu.classList.add("hidden");
});
document.addEventListener("click", () => {
  proxyipDropdownMenu.classList.add("hidden");
});
proxyipDropdown.addEventListener("click", (e) => e.stopPropagation());

checkBtn.addEventListener("click", () => checkEnvironment().catch(err => showAlert(err.message, "检测失败", "error")));
clearCountryBtn.addEventListener("click", () => {
  for (const button of countrySelect.querySelectorAll(".country-chip.selected")) {
    button.classList.remove("selected");
    button.setAttribute("aria-pressed", "false");
  }
});
countrySelect.addEventListener("click", event => {
  const button = event.target.closest(".country-chip");
  if (!button) return;
  const selected = !button.classList.contains("selected");
  button.classList.toggle("selected", selected);
  button.setAttribute("aria-pressed", selected ? "true" : "false");
});
modeToggle.addEventListener("click", event => {
  const button = event.target.closest(".mode-option");
  if (!button) return;
  for (const item of modeToggle.querySelectorAll(".mode-option")) item.classList.remove("selected");
  button.classList.add("selected");
});

loadConfig().catch(err => showAlert(err.message, "加载配置失败", "error"));
refresh().catch(err => showAlert(err.message, "获取状态失败", "error"));
checkEnvironment().catch(() => {
  envPanel.className = "panel env-panel blocked";
  envSummary.className = "env-summary blocked";
  envSummary.innerHTML = `<span>环境检测失败，请检查网络或配置。</span>`;
});
setInterval(() => refresh().catch(() => {}), 2500);
