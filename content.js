// 【重要】メインの入力フォームがあるページ（部屋）以外ではプログラムを動かさないようにする
// URLに continuous が含まれていない場合は、即座に処理を終了します
if (!window.location.href.includes('continuous')) {
  // 何もしない
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
        準備中...
      </div>
      <div style="display:flex; gap:10px;">
        <button id="ext-btn-ok" style="flex:1; padding:8px; background:#28a745; color:white; border:none; border-radius:4px; font-weight:bold; cursor:pointer;">次へ（確認終了）</button>
        <button id="ext-btn-cancel" style="padding:8px; background:#dc3545; color:white; border:none; border-radius:4px; cursor:pointer;">中止</button>
      </div>
    `;
    document.body.appendChild(panel);
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

    // --- メインフォームへの総当たり入力 ---
    
    // 1. 媒体コード
    const mediaInputs = document.querySelectorAll('input[name*="media"], input[id*="media"], input[type="text"]');
    if (mediaInputs.length > 0) {
      mediaInputs[0].value = commonData.mediaCode;
      mediaInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
      mediaInputs[0].dispatchEvent(new Event('change', { bubbles: true }));
    }

    // 2. コース番号
    const courseInputs = document.querySelectorAll('input[name*="course"], input[id*="course"]');
    if (courseInputs.length > 0) {
      courseInputs.forEach(input => {
        input.value = courseNumber;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    } else if (mediaInputs.length > 1) {
      // 適切な名前が見つからない場合のフォールバック（画面の下の方にあるテキスト欄）
      const possibleCourseInput = mediaInputs[mediaInputs.length - 1];
      possibleCourseInput.value = courseNumber;
      possibleCourseInput.dispatchEvent(new Event('input', { bubbles: true }));
      possibleCourseInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // 3. 発送日
    const dateInputs = document.querySelectorAll('input[type="date"], input[name*="hassou"], input[name*="date"]');
    if (dateInputs.length > 0) {
      dateInputs.forEach(input => {
        input.value = commonData.shipDate.replace(/-/g, ''); // YYYYMMDD形式
        if(!input.value) input.value = commonData.shipDate; 
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    } else {
      // 日付の入力欄がテキストタイプ（type="text"）の場合の総当たり検索
      mediaInputs.forEach(input => {
        if (input.placeholder && input.placeholder.includes('例')) {
          input.value = commonData.shipDate.replace(/-/g, '');
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    }

    // 4. 部数
    const volumeInputs = document.querySelectorAll('input[name*="busu"], input[name*="vol"]');
    volumeInputs.forEach(input => {
      input.value = commonData.volume;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // 5. 固定値（営業本部・出発地）
    const selects = document.querySelectorAll('select');
    selects.forEach(select => {
      if (select.options.length > 1) {
        select.selectedIndex = 1; // 上から2番目を選択
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    // 6. ファイル名表示欄
    const fileInputs = document.querySelectorAll('input[name*="file"], input[id*="file"]');
    fileInputs.forEach(input => {
      if (input.type === 'text') {
        input.value = currentFileName;
      }
    });

    await new Promise(resolve => setTimeout(resolve, 300));

    infoContent.innerHTML = `
      <b>処理中:</b> ${index + 1} / ${fileNames.length} 件目<br>
      <b>ファイル名:</b> <span style="color:#555;">${currentFileName}</span><br>
      <b>抽出コース番号:</b> <span style="color:#d9534f; font-weight:bold;">${courseNumber}</span><br><br>
      <span style="color:#28a745; font-size:12px; font-weight:bold;">左側のフォームに文字が自動入力されたか確認してください。</span>
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
