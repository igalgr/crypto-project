const cardsUrl = 'https://api.coingecko.com/api/v3/coins/';
const priceUrl = 'https://www.cryptocompare.com/api/#-api-data-price-';
const currencyUrl =
  'https://api.coingecko.com/api/v3/coins/markets?vs_currency=USD';
const iveCurrencyUrl =
  'https://min-api.cryptocompare.com/data/pricemultifull?fsyms=%s&tsyms=%a';
let cryptoCard = [];
const uncheckCard = [];
let compareList = [];
let cards = [];
let cacheStorage = null;

const setCachedData = async (cacheId, coinData) => {
  try {
    if (!cacheStorage) {
      cacheStorage = await caches.open('cryptoInfo');
    }
    coinData.timestamp = Date.now();
    await cacheStorage.put(cacheId, new Response(JSON.stringify(coinData)));
  } catch (error) {
    console.error(error, 'Error caching data');
  }
};

const getCachedData = async cacheId => {
  try {
    if (!cacheStorage) {
      cacheStorage = await caches.open('cryptoInfo');
    }

    const coinData = await cacheStorage.match(cacheId);
    if (!coinData) {
      return null;
    }

    const coinDataJson = await coinData.json();
    const timeIsOver = (Date.now() - coinDataJson.timestamp) / 1000;
    if (timeIsOver > 120) {
      cacheStorage.delete(cacheId);
      return null;
    }
    return coinDataJson;
  } catch (error) {
    console.error(error, 'Error receiving cached data');
    return null;
  }
};

$(async () => {
  try {
    $('.loading-spinner').show();
    cryptoCard = await $.get(currencyUrl);
    $('.loading-spinner').hide();
    createCards();
    $('#searchInput').on('input', searchInCryptoCards);
  } catch (error) {
    console.error(error, 'Error loading');
  }
});

const getMoreCurrencyData = async (id, collapseCardId) => {
  try {
    const spinner = $('#' + collapseCardId).find('.spinner-border');
    const cryptoMoreData = $('#' + collapseCardId).find('.cryptoMoreInfo');
    cryptoMoreData.hide();
    spinner.show();
    let coinData = await getCachedData(id);
    if (!coinData) {
      coinData = await $.get(cardsUrl + id);
      setCachedData(id, coinData);
    }

    spinner.hide();
    cryptoMoreData.show();
    updateCollapseCard(collapseCardId, coinData);
  } catch (error) {
    console.error(error);
  }
};

const updateCollapseCard = (collapseCardId, coinData) => {
  const collapseCard = $('#' + collapseCardId);
  collapseCard.find('img').attr('src', coinData.image.small);
  collapseCard.find('.usdValue').html(coinData.market_data.current_price.usd);
  collapseCard.find('.eurValue').html(coinData.market_data.current_price.eur);
  collapseCard.find('.ilsValue').html(coinData.market_data.current_price.ils);
};

const addToCompareList = (coinSymbol, coinId, checkBox) => {
  if (!checkBox.checked) {
    compareList = compareList.filter(coin => coin.coinId !== coinId);
    return;
  }
  compareList.push({ coinId: coinId, coinSymbol: coinSymbol });

  if (compareList.length === 6) {
    createModalStructure();
  }
};

const cancelReplacing = () => {
  uncheckCard.splice(0, uncheckCard.length);
  const lastElement = compareList.pop();
  $('#toggle' + lastElement.coinId).prop('checked', false);
};

const replaceCoin = () => {
  if (uncheckCard.length === 0) {
    const lastElement = compareList.pop();
    $('#toggle' + lastElement.coinId).prop('checked', false);
    return;
  }
  uncheckCard.map(coinId => {
    compareList = compareList.filter(element => element.coinId !== coinId);
    $('#toggle' + coinId).prop('checked', false);
  });
  uncheckCard.splice(0, uncheckCard.length);
};

const uncheckCoin = target => {
  if (!target.checked) {
    uncheckCard.push(target.id);
    return;
  }
  uncheckCard.splice(uncheckCard.indexOf(target.id), 1);
};

const searchInCryptoCards = () => {
  const searchVal = $('#searchInput').val().toLowerCase();
  if (searchVal === '') {
    createCards();
    ``;
    return;
  }
  const searchRes = cryptoCard.filter(
    item =>
      item.id.toLowerCase().includes(searchVal) ||
      item.symbol.toLowerCase().includes(searchVal)
  );
  createCards(searchRes);
};

const createCards = (data = cryptoCard) => {
  $('#cryptoCards').html('');
  data.map((card, index) => {
    const id = `cardExtendedInfo${index}`;
    const isChecked = compareList.some(coin => coin.coinId === card.id);
    const cardStructure = `
      <div class="cards">
        <div class="card" style="width: 300px">
          <div class="card-body">
            <label class="switch">
              <input type="checkbox" class="toggle" 
                id="toggle${card.id}" 
                onclick="addToCompareList('${card.symbol}', '${
      card.id
    }', this)" 
                data-card-inp=${card.id}
                ${isChecked ? 'checked' : ''}>
              <span class="slider round"></span>
            </label>
            <h4 class="card-title">${card.symbol}</h4>
            <p class="card-text">${card.name}</p>
            <button class="btn btn-primary moreInfo" 
              onclick="getMoreCurrencyData('${card.id}', '${id}')" 
              data-bs-toggle="collapse"
              data-bs-target="#${id}" 
              aria-expanded="false">More Info
            </button>
          </div>
          <div class="collapse flex-grow-0" id="${id}">
            ${getMoreCurrencyDataCollapse()}
          </div>
        </div>
      </div>
    `;
    $('#cryptoCards').append(cardStructure);
  });
};

const getMoreCurrencyDataCollapse = () => {
  return `
    <div class="cardCollapse">
      <div class="cardCollapseWrap">
        <div class="spinner-border text-primary" style="display: block;"></div>
        <div class="cryptoMoreInfo">
          <img src="" class="coinImg">
        </div>
        <div class="cryptoMoreInfo">
          USD $: <span class="usdValue"></span>
        </div>
        <div class="cryptoMoreInfo">
          EUR €: <span class="eurValue"></span>
        </div>
        <div class="cryptoMoreInfo">
          ILS ₪: <span class="ilsValue"></span>
        </div>
      </div>
    </div>
  `;
};

const createModalStructure = () => {
  const compareModal = $('#myModal');
  let modalContent = document.createElement('div');
  modalContent.id = 'myModal';
  const tmp = [...compareList];
  console.log(tmp.pop());
  tmp.forEach(item => {
    modalContent.innerHTML += `
     <div class="form-check form-switch form-switch-sm">
     <input type="checkbox" class="form-check-input" 
     id="${item.coinId}" 
     checked onclick="uncheckCoin(this)">
      ${item.coinId}:
    </div>`;
  });
  compareModal.find('.modal-body').html(modalContent);
  compareModal.modal('show');
};

let chartsData = [];
let liveReportsInterval;
let chart;

const cryptoLinkHashCode = s => {
  return s.split('').reduce(function (a, b) {
    a = a + b.charCodeAt(0);
    return a & a;
  }, 0);
};

const saveCryptoLinkHashCode = cryptoLink => {
  sessionStorage.setItem('cryptoLinkHashCode', cryptoLinkHashCode(cryptoLink));
};

const compareCryptoLinksHashCodes = cryptoLink => {
  const newCryptoLinkHashCode = cryptoLinkHashCode(cryptoLink);
  return (
    sessionStorage.getItem('cryptoLinkHashCode') &&
    newCryptoLinkHashCode ===
      parseInt(sessionStorage.getItem('cryptoLinkHashCode'))
  );
};

const displayLiveChart = async () => {
  if (!compareList || compareList.length === 0) {
    chart ? chart.destroy() : () => {};
    chart = null;
    return;
  }

  const uriParameters = compareList.map(item => item.coinSymbol).join(',');
  const cryptoLink = iveCurrencyUrl
    .replace('%s', uriParameters)
    .replace('%a', 'USD,EUR');
  const compareResult = compareCryptoLinksHashCodes(cryptoLink);
  $('.loading-spinner').show();
  const liveReport = await $.get(cryptoLink);
  $('.loading-spinner').hide();

  const coinsRawData = liveReport.RAW;
  const date = new Date();
  if (compareResult && chartsData.length > 0) {
    chartsData.forEach(item => {
      const coinData = coinsRawData[item.name];
      item.dataPoints.push({
        x: date,
        y: coinData.USD.PRICE,
      });
    });
  } else {
    chartsData = [];
    for (let key in coinsRawData) {
      const coinData = coinsRawData[key];
      chartsData.push({
        type: 'spline',
        name: key,
        showInLegend: true,
        dataPoints: [
          {
            x: date,
            y: coinData.USD.PRICE,
          },
        ],
      });
    }
  }
  if (!chart) {
    const options = {
      exportEnabled: true,
      animationEnabled: true,
      title: {
        text: 'Comparing Coins',
      },
      axisX: {
        title: 'Time',
        valueFormatString: 'HH:mm:ss',
        labelAngle: -50,
      },
      axisY: {
        title: 'Coin Value',
        titleFontColor: '#4F81BC',
        lineColor: '#4F81BC',
        labelFontColor: '#4F81BC',
        tickColor: '#4F81BC',
      },
      toolTip: {
        shared: true,
      },
      data: chartsData,
    };
    chart = new CanvasJS.Chart('coinsChart', options);
    chart.render();
  } else {
    chart.options.data = chartsData;
    chart.render();
  }
  if (liveReportsInterval) {
    clearInterval(liveReportsInterval);
  }
  saveCryptoLinkHashCode(cryptoLink);
  liveReportsInterval = setInterval(displayLiveChart, 2000);
};

$('.liveReports').hide();
$('.about').hide();

$('#homePage').on('click', () => {
  $('.coinsPage').show();
  $('.liveReports').hide();
  $('.about').hide();
  $('#searchInput').show();
  clearInterval(liveReportsInterval);
  window.location.hash = '/Home';
});

$('#liveReportsPage').on('click', () => {
  $('.liveReports').show();
  $('.coinsPage').hide();
  $('.about').hide();
  $('#searchInput').hide();
  window.location.hash = '/LiveReport';
});

$('#aboutPage').on('click', () => {
  $('.about').css({ display: 'flex' });
  $('.coinsPage').hide();
  $('.liveReports').hide();
  $('#searchInput').hide();
  clearInterval(liveReportsInterval);
  window.location.hash = '/About';
});

$('.webTitle').css(
  'background-position',
  'center ' + $(this).scrollTop() / 2 + 'px'
);
$(window).scroll(() => {
  let scrollTop = $(this).scrollTop();
  $('.webTitle').css('background-position', 'center ' + scrollTop / 2 + 'px');
});
