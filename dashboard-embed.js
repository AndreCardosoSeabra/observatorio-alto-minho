(() => {
  const config = window.POWER_BI_CONFIG || {};
  const embedUrl = String(config.embedUrl || "").trim();

  if (!embedUrl) return;

  let parsedUrl;
  try {
    parsedUrl = new URL(embedUrl);
  } catch {
    console.error("O endereço de incorporação do Power BI não é válido.");
    return;
  }

  if (parsedUrl.protocol !== "https:" || parsedUrl.hostname !== "app.powerbi.com") {
    console.error("O endereço de incorporação tem de pertencer a https://app.powerbi.com.");
    return;
  }

  const reportTitle = config.title || "Dashboard do Observatório Alto Minho";
  const shell = document.createElement("main");
  shell.className = "powerbi-shell";
  shell.setAttribute("aria-label", reportTitle);

  const frame = document.createElement("iframe");
  frame.className = "powerbi-frame";
  frame.src = parsedUrl.toString();
  frame.title = reportTitle;
  frame.allowFullscreen = true;
  frame.setAttribute("loading", "eager");
  frame.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");

  shell.appendChild(frame);
  document.body.replaceChildren(shell);
  document.body.classList.add("powerbi-embedded");
})();
