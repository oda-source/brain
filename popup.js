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

  // 【変更点】拡張機能を起動した「元のBrain画面」のタブを探す
  const tabs = await chrome.tabs.query({ currentWindow: true });
  // ポップアップ自身ではない、かつBrainのURLを含んでいるタブを探す
  const brainTab = tabs.find(t => t.url && (t.url.includes('hankyu') || t.url.includes('localhost')));
  
  if (!brainTab) {
    alert('Brainの管理画面が見つかりません。画面を開いた状態で実行してください。');
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
      alert('自動化スクリプトの起動に失敗しました。ページを再読み込みしてください。');
    } else {
      // 処理が始まったらこの入力窓は閉じる
      window.close();
    }
  });
});
