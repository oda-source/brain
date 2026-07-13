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
      <button id="ext-btn-ok" style="flex:1; padding:8px; background:#28a745; color:white; border:none; border-radius:4px; font-weight:bold; cursor:pointer;">一括登録して次へ</button>
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

  // --- HTML解析に基づいた正確なフォーム自動入力 ---
  try {
    // 1. 媒体コード
    const mediaInput = document.querySelector('input[name="media_cd"]') || document.getElementById('media_cd');
    if (mediaInput) {
      mediaInput.value = commonData.mediaCode;
      mediaInput.dispatchEvent(new Event('input', { bubbles: true }));
      mediaInput.dispatchEvent(new Event('change', { bubbles: true }));
      mediaInput.blur(); // フォーカスを外してサイト側の「媒体名」自動読み込みをキック
    }

    // 2. コース番号
    const courseInput = document.querySelector('input[name="course_no"]') || document.getElementById('course_no');
    if (courseInput) {
      courseInput.value = courseNumber;
      courseInput.dispatchEvent(new Event('input', { bubbles: true }));
      courseInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // 3. 発送日
    const dateInput = document.querySelector('input[name="hassou_ymd"]') || document.getElementById('hassou_ymd');
    if (dateInput && commonData.shipDate) {
      // 日付フォーマットの調整（YYYY-MM-DD から YYYYMMDD への変換が必要な場合に対応）
      const formattedDate = commonData.shipDate.replace(/-/g, '');
      dateInput.value = formattedDate;
      dateInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // 4. 部数
    const volumeInput = document.querySelector('input[name="busu"]') || document.getElementById('busu');
    if (volumeInput && commonData.volume) {
      volumeInput.value = commonData.volume;
      volumeInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // 5. 営業本部（固定値選択）
    const honbuSelect = document.querySelector('select[name="honbu_cd"]') || document.getElementById('honbu_cd');
    if (honbuSelect) {
      // 毎回決まった項目を選びたい場合、現在の「何番目か（0から数える）」を指定します。
      // 例: 2番目の項目なら 1 を指定。適宜数字を変更してください。
      honbuSelect.selectedIndex = 1; 
      honbuSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // 6. 出発地（固定値選択）
    const syuppatsuSelect = document.querySelector('select[name="shuppatsu_cd"]') || document.getElementById('shuppatsu_cd');
    if (syuppatsuSelect) {
      // 例: 2番目の項目なら 1 を指定。適宜数字を変更してください。
      syuppatsuSelect.selectedIndex = 1;
      syuppatsuSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // 7. ファイル名（表示欄）
    const fileNameDisplayInput = document.querySelector('input[name="file_name"]') || document.getElementById('file_name');
    if (fileNameDisplayInput) {
      fileNameDisplayInput.value = currentFileName;
    }

  } catch (e) {
    console.error("入力中にエラーが発生しました:", e);
  }

  // サイト側のJavaScript連動（媒体名の取得など）を少し待つ（0.5秒）
  await new Promise(resolve => setTimeout(resolve, 500));

  // 右上のナビゲーションパネルの文字を更新
  infoContent.innerHTML = `
    <b>処理中:</b> ${index + 1} / ${fileNames.length} 件目<br>
    <b>ファイル名:</b> <span style="color:#555;">${currentFileName}</span><br>
    <b>抽出コース番号:</b> <span style="color:#d9534f; font-weight:bold;">${courseNumber}</span><br><br>
    <span style="color:#28a745; font-size:12px; font-weight:bold;">左側のフォームに文字が自動入力されたことを確認してください。</span>
  `;

  // ボタンを押すまでの待機処理
  return new Promise((resolve) => {
    document.getElementById('ext-btn-ok').onclick = async () => {
      // HTML解析に基づく正確な「一括登録」ボタンのクリック
      const registerBtn = document.querySelector('input[value="一括登録"]') || document.querySelector('.btn-red') || document.querySelector('#submit_btn');
      
      if (registerBtn) {
        // 【テスト完了後の自動化】
        // 実際に人間の代わりに「一括登録」ボタンを自動でカチッと押させたい場合は、
        // 下の行の先頭にある「//」を消して保存してください。
        // registerBtn.click();
        
        console.log("一括登録ボタンが認識されました。");
      }

      // 次のファイルへ進む
      resolve(processFile(fileNames, index + 1, commonData));
    };

    document.getElementById('ext-btn-cancel').onclick = () => {
      alert("自動登録を中止しました。");
      panel.remove();
    };
  });
}
