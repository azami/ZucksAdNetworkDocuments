(function () {
  'use strict';

  var slice = Array.prototype.slice;

  // サポートブラウザ:
  // - Android4以上のChrome
  // - iOS9以上のSafari
  // (注意) iOS8以前のSafariはSyntax Errorが出る

  function getHTMLTemplate() {
    // 広告のHTMLを変更する場合はこのテンプレートを修正する
    // サポートしているassetsのマクロ
    // {IMAGE_SRC} :       広告画像URL
    // {TITLE}:            広告タイトル
    // {BODY_TEXT}:        広告の本文
    // {PRODUCT_NAME}:     サービス・商品名
    // {ADVERTISER_NAME}:  広告主名
    // {LINK_BUTTON_TEXT}: リンクボタン設置時のテキスト
    // {LANDING_URL}:      広告タップ時の遷移先URL
    // {DISCLOSURE}:       PR表記 この項目は広告タグの `data-disclosure-label` attributeで設定する
    // @see: https://github.com/zucks/ZucksAdNetworkDocuments/blob/master/webapi/Zucks-Ad-Network-Native-api-specification-v2.md#response-body
    return `
      <a href="{LANDING_URL}" target="_blank">
        <div>
          <img class="zucks-native-image" src="{IMAGE_SRC}" />
        </div>
        <div class="zucks-native-description">
          <p class="zucks-native-title">{TITLE}</p>
          <div class="zucks-native-row">
            <div class="zucks-native-text">
              <div>{BODY_TEXT}</div>
            </div>
            <div class="zucks-native-button">{LINK_BUTTON_TEXT}</div>
          </div>
          <div class="zucks-native-row zucks-native-sponsored">
            <div>
              <p>{PRODUCT_NAME}</p>
            </div>
            <div>
              <p>{ADVERTISER_NAME}</p>
            </div>
            <div>
              <p>{DISCLOSURE}</p>
            </div>
          </div>
        </div>
      </a>`;
  }

  function getFillerHTML() {
    // フィラーが必要な場合は、ここでフィラーのHTMLを返すように修正する
    return '';
  }

  function renderHTML(element, assets) {
    var disclosureAttribute = 'data-disclosure-label';
    var defaultDisclosure = '[PR]';
    var nativeHTML;
    var disclosure = '';
    if (assets.status === 'ok') {
      disclosure = element.getAttribute(disclosureAttribute) || defaultDisclosure;
      nativeHTML = getHTMLTemplate()
        .replace(/{IMAGE_SRC}/g, assets.image_src)
        .replace(/{TITLE}/g, assets.title)
        .replace(/{BODY_TEXT}/g, assets.body_text)
        .replace(/{PRODUCT_NAME}/g, assets.product_name)
        .replace(/{ADVERTISER_NAME}/g, assets.advertiser_name)
        .replace(/{LINK_BUTTON_TEXT}/g, assets.link_button_text)
        .replace(/{LANDING_URL}/g, assets.landing_url)
        .replace(/{DISCLOSURE}/g, disclosure);
    } else {
      nativeHTML = getFillerHTML();
    }

    element.innerHTML = `
      <div class="zucks-native">
        ${nativeHTML}
        <img style="display: none" src="${assets.imp_url}" />
      </div>`;
    element.setAttribute('datetime', new Date().toISOString());
  }

  function renderAd(frameIdAttribute, element) {
    var frameid = element.getAttribute(frameIdAttribute);
    var url = `https://sh.zucks.net/opt/native/api/v2?frameid=${frameid}`;
    var xhr = new XMLHttpRequest();

    element.style.textDecoration = 'none';
    xhr.open('GET', url, true);
    xhr.onload = function () {
      if (xhr.status === 200) {
        try {
          renderHTML(element, JSON.parse(xhr.responseText));
        } catch (e) {
          console.log(e); // eslint-disable-line no-console
          console.log(xhr); // eslint-disable-line no-console
          element.innerHTML = getFillerHTML();
        }
      } else {
        element.innerHTML = getFillerHTML();
      }
    };
    xhr.send();
  }

  class AdRenderer {
    push() {
      var frameIdAttribute = 'data-zucks-frame-id';
      var renderAdBindFrameId = renderAd.bind(undefined, frameIdAttribute);
      slice.call(document.getElementsByTagName('ins'))
        .filter(function (element) {
          return element.hasAttribute(frameIdAttribute) && !element.hasChildNodes();
        })
        .forEach(renderAdBindFrameId);
    }
  }

  if (window.adsbyzucks === undefined
      || window.adsbyzucks === null
      || Array.isArray(window.adsbyzucks)) {
    window.adsbyzucks = new AdRenderer();
    window.adsbyzucks.push();
  }
}());
