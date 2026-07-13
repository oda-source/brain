// 【追加】もし通常のポップアップとして開かれたら、即座に独立した別ウィンドウで開き直す
if (!window.location.search.includes('mode=window')) {
  chrome.windows.create({
    url: chrome.runtime.getURL("popup.html?mode=window"),
    type: "popup",
    width: 360,
    height: 580
  });
  window.close(); // 元の消えちゃうポップアップは一瞬で閉じる
}

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const statusText = document.getElementById('status');
const startBtn = document.getElementById('startBtn');

let selectedFiles = [];

dropZone.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
  selectedFiles = Array.from(e.target.files);
  if (selectedFiles.length > 0) {
    statusText.innerText = `${selectedFiles.length}個のファイルが選択されています`;
    statusText.style.color = '#28a745';
  } else {
    statusText.innerText = 'ファイル未選択';
    statusText.style.color = '#666';
  }
});

startBtn.addEventListener('click', async () => {
  const mediaCode = document.getElementById('mediaCode').value;
  const shipDate = document.getElementById('shipDate').value;
  const volume = document.getElementById('volume').value;

  if (!mediaCode) {
    alert('媒体コードを入力してください。');
    return;
  }
  if (selectedFiles.length === 0) {
    alert('登録するPDFファイルを選択してください。');
    return;
  }

  const fileNames = selectedFiles.map(file => file.name);

  // 拡張機能を起動した「元のBrain画面」のタブを探す
  const tabs = await chrome.tabs.query({});
  const brainTab = tabs.find(t => t.url && t.url.includes('brain.hankyu-travel.com'));
  
  if (!brainTab) {
    alert('Brainの管理画面（brain.hankyu-travel.com）が見つかりません。画面を開いた状態で実行してください。');
    return;
  }

  // 操作用スクリプト（content.js）へデータを送信
  chrome.tabs.sendMessage(brainTab.id, {
    action: "START_AUTOMATION",
    data: {
      mediaCode: mediaCode,
      shipDate: shipDate,
      volume: volume,
      fileNames: fileNames
    }
  }, (response) => {
    if (chrome.runtime.lastError) {
      alert('自動化スクリプトの起動に失敗しました。Brainのページを一度再読み込み（F5）してから再度お試しください。');
    } else {
      // 処理が始まったらこの入力窓は閉じる
      window.close();
    }
  });
});
