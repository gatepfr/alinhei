function injectButton() {
  // Evita duplicatas
  if (document.getElementById('alinhei-btn')) return;

  let descriptionElement = null;
  let targetContainer = null;

  // LinkedIn
  if (window.location.hostname.includes('linkedin.com')) {
    descriptionElement = document.querySelector('.jobs-description--inner') || 
                         document.querySelector('.jobs-search__job-details--container') ||
                         document.querySelector('#job-details');
    targetContainer = document.querySelector('.jobs-unified-top-card__content--two-pane') ||
                      document.querySelector('.jobs-details-top-card__content--two-pane') ||
                      document.querySelector('.jobs-top-card');
  } 
  // Gupy
  else if (window.location.hostname.includes('gupy.io')) {
    descriptionElement = document.querySelector('[data-testid="text-section"]') || 
                         document.querySelector('.job-description');
    targetContainer = document.querySelector('[data-testid="job-detail-header"]') ||
                      document.querySelector('.header');
  }

  if (descriptionElement && targetContainer) {
    const btn = document.createElement('button');
    btn.id = 'alinhei-btn';
    btn.innerText = '✨ Analisar com Alinhei';
    btn.style.backgroundColor = '#0066FF';
    btn.style.color = 'white';
    btn.style.border = 'none';
    btn.style.padding = '8px 16px';
    btn.style.borderRadius = '8px';
    btn.style.fontWeight = 'bold';
    btn.style.cursor = 'pointer';
    btn.style.margin = '10px 0';
    btn.style.fontSize = '14px';
    btn.style.display = 'block';
    btn.style.zIndex = '9999';

    btn.onclick = () => {
      const text = descriptionElement.innerText;
      const url = `https://alinhei.com/analise?vaga=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
    };

    targetContainer.appendChild(btn);
  }
}

// Observa mudanças na página (LinkedIn carrega vagas dinamicamente)
const observer = new MutationObserver(() => {
  injectButton();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Executa inicialmente
injectButton();
