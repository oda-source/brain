if (!window.location.href.includes('continuous') && !document.querySelector('form')) {
  // 登録用のフォームが存在しないページでは動作させない
} else {

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "START_AUTOMATION") {
      const { mediaCode, shipDate, volume, fileNames } = request.data;
      createConfirmPanel();
      processFile(fileNames, 0, { mediaCode, shipDate, volume });
      sendResponse({ status: "started" });
    }
    return true;
  });

  function createConfirmPanel() {
    if (document.getElementById('ext-confirm-panel')) return;
    const panel = document.createElement('div');
    panel.id = 'ext-confirm-panel';
    panel.style.position = 'fixed';
    panel.style.top = '20px';
    panel.style.right = '20px';
    panel.style.zIndex = '999999';
    panel.style.backgroundColor = '#ffffff';
    panel.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
    panel.style.padding = '20px';
    panel.style.borderRadius = '8px';
    panel.style.width = '300px';
    panel.style.fontFamily = 'sans-serif';
    panel.style.border = '2px solid #007bff';

    panel.innerHTML = `
      <h4 style="margin:0 0 10px 0; color:#007bff;">Brain 自動登録ナビ</h4>
      <div id="ext-info-content" style="font-size:13px; line-height:1.5; margin-bottom:15px; color:#333;">
        画面の読み込みとフォームの検出を待っています...
      </div>
      <div style="display:flex; gap:10px;">
        <button id="ext-btn-ok" style="flex:1; padding:8px; background:#28a745; color:white; border:none; border-radius:4px; font-weight:bold; cursor:pointer;">次へ（確認終了）</button>
        <button id="ext-btn-cancel" style="padding:8px; background:#dc3545; color:white; border:none; border-radius:4px; cursor:pointer;">中止</button>
      </div>
    `;
    document.body.appendChild(panel);
  }

  // 確実に入力イベントを発生させる関数
  function forceInputValue(inputElement, value) {
    if (!inputElement) return;
    inputElement.focus();
    inputElement.value = value;
    const events = ['input', 'change', 'propertychange', 'keyup', 'keydown', 'blur'];
    events.forEach(eventName => {
      inputElement.dispatchEvent(new Event(eventName, { bubbles: true, cancelable: true }));
    });
    inputElement.blur();
  }

  // ドロップダウン（セレクトボックス）を値（value）または表示テキストで確実に選択する関数
  function forceSelectValue(selectElement, targetText, targetValue) {
    if (!selectElement) return;
    selectElement.focus();
    
    let matched = false;
    for (let i = 0; i < selectElement.options.length; i++) {
      if (selectElement.options[i].value === targetValue || selectElement.options[i].text.includes(targetText)) {
        selectElement.selectedIndex = i;
        matched = true;
        break;
      }
    }
    
    if (matched) {
      selectElement.dispatchEvent(new Event('change', { bubbles: true }));
      selectElement.blur();
    }
  }

  async function processFile(fileNames, index, commonData) {
    const panel = document.getElementById('ext-confirm-panel');
    const infoContent = document.getElementById('ext-info-content');

    if (index >= fileNames.length) {
      infoContent.innerHTML = "<b style='color:#28a745;'>すべての登録処理が完了しました！</b>";
      document.getElementById('ext-btn-ok').style.display = 'none';
      document.getElementById('ext-btn-cancel').textContent = '閉じる';
      document.getElementById('ext-btn-cancel').onclick = () => panel.remove();
      return;
    }

    const currentFileName = fileNames[index];
    const fileNameParts = currentFileName.split('_');
    
    if (fileNameParts.length < 2) {
      alert(`ファイル名「${currentFileName}」からコース番号を抽出できませんでした。`);
      panel.remove();
      return;
    }
    const courseNumber = fileNameParts[1];

    // 画面上のすべてのテキスト入力欄を取得（順番ベースでの確実な突合用）
    const allTextInputs = Array.from(document.querySelectorAll('input[type="text"], input:not([type])'));
    
    if (allTextInputs.length < 2) {
      infoContent.innerHTML = "<b style='color:#dc3545;'>エラー: 入力フォームが検出できません。</b><br>ページを再読み込み(F5)してやり直してください。";
      return;
    }

    // --- 【確定HTML解析に基づく自動入力】 ---
    
    // 1. 媒体コード（画面の最上部にある1番目のテキスト入力欄）
    const mediaInput = allTextInputs[0];
    if (mediaInput) {
      forceInputValue(mediaInput, commonData.mediaCode);
    }

    // 2. コース番号（画面最下部の「コース番号※」の横にある入力欄）
    // デベロッパーツール画像より、name="course_no" または最後の方の入力欄
    const courseInput = document.querySelector('input[name="course_no"]') || document.querySelector('input[name*="course"]') || allTextInputs[allTextInputs.length - 1];
    if (courseInput) {
      forceInputValue(courseInput, courseNumber);
    }

    // 3. 発送日（カレンダー横の入力欄、あるいはname="hassou_ymd"）
    // テキスト入力欄の中から「例」というプレースホルダーがあるもの、または2026等の初期値が入っている欄を自動スキャン
    const cleanDate = commonData.shipDate ? commonData.shipDate.replace(/-/g, '') : "";
    const dateInput = document.querySelector('input[name="hassou_ymd"]') || document.getElementById('hassou_ymd') || allTextInputs.find(input => input.placeholder && input.placeholder.includes('例')) || allTextInputs[2];
    if (dateInput && cleanDate) {
      forceInputValue(dateInput, cleanDate);
    }

    // 4. 部数
    const volumeInput = document.querySelector('input[name="busu"]') || document.getElementById('busu') || allTextInputs[3];
    if (volumeInput && commonData.volume) {
      forceInputValue(volumeInput, commonData.volume);
    }

    // 5. 【固定値】営業本部 ➔ 画像の「input_honbu_cd」をピンポイント指定
    const honbuSelect = document.querySelector('select[name="input_honbu_cd"]') || document.querySelector('select[name*="honbu"]') || document.querySelector('select');
    forceSelectValue(honbuSelect, "メディア営業本部", "15");

    // 6. 【固定値】出発地 ➔ 画像の「input_shuppatsu_cd」をピンポイント指定
    const syuppatsuSelect = document.querySelector('select[name="input_shuppatsu_cd"]') || document.querySelector('select[name*="shuppatsu"]') || document.querySelectorAll('select')[1];
    forceSelectValue(syuppatsuSelect, "関西", "02");

    // 7. ファイル名表示欄（もし存在すれば）
    const fileNameDisplayInput = document.querySelector('input[name="file_name"]') || document.querySelector('input[name*="file"]');
    if (fileNameDisplayInput) {
      forceInputValue(fileNameDisplayInput, currentFileName);
    }

    // サイト側JavaScriptの連動処理を少し待つ（0.5秒）
    await new Promise(resolve => setTimeout(resolve, 500));

    // ナビゲーションパネルのテキスト表示を更新
    infoContent.innerHTML = `
      <b>処理中:</b> ${index + 1} / ${fileNames.length} 件目<br>
      <b>ファイル名:</b> <span style="color:#555;">${currentFileName}</span><br>
      <b>抽出コース番号:</b> <span style="color:#d9534f; font-weight:bold;">${courseNumber}</span><br><br>
      <span style="color:#28a745; font-size:12px; font-weight:bold;">左側のフォームをご確認ください。<br>文字が自動入力され、営業本部と出発地が選択されていれば成功です！</span>
    `;

    return new Promise((resolve) => {
      document.getElementById('ext-btn-ok').onclick = () => {
        resolve(processFile(fileNames, index + 1, commonData));
      };
      document.getElementById('ext-btn-cancel').onclick = () => {
        alert("自動登録を中止しました。");
        panel.remove();
      };
    });
  }
}
