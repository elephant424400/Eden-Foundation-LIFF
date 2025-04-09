// 使用 LIFF 初始化
let user_id;

document.addEventListener('DOMContentLoaded', function () {
    const message = document.getElementById('message');
    liff
        .init({
            liffId: '2007229383-LyDMdepm', // 請確認此 LIFF ID 是否正確
        })
        .then(() => {
            // 獲取用戶資料
            getUserProfile();
        })
        .catch((err) => {
            // 初始化失敗的處理
            message.textContent = `LIFF initialization failed: ${err.message}`;
            setTimeout(() => liff.closeWindow(), 3000);
        });
});

// 獲取用戶資料
function getUserProfile() {
    liff
        .getProfile()
        .then((profile) => {
            message.textContent = `Success to Login`;
            setTimeout(() => (message.textContent = ''), 3000);
            user_id = profile.userId;
        })
        .catch((err) => {
            message.textContent = `Failed to get user profile: ${err.message}`;
        });
}

// 表單提交處理
const form = document.getElementById('evaluationForm');
const submitBtn = document.querySelector('.submit-btn');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!user_id) {
        alert('User ID 尚未載入，請稍後再試！');
        return;
    }

    // 驗證團隊人數是否為正整數
    const teamSize = document.getElementById('teamSize').value;
    if (teamSize <= 0 || !Number.isInteger(Number(teamSize))) {
        alert('團隊人數必須為正整數');
        return;
    }

    const originalText = submitBtn.textContent;
    submitBtn.textContent = '預測中...';
    submitBtn.disabled = true;
    submitBtn.style.backgroundColor = '#6c757d';

    const message = document.getElementById('message');

    // 收集表單資料
    const formData = {
        領導人能力: document.getElementById('leaderAbility').value,
        領導風格: document.getElementById('leaderStyle').value,
        主責人能力: document.getElementById('mainPersonAbility').value,
        主責人風格: document.getElementById('mainPersonStyle').value,
        場域: document.getElementById('field').value,
        團隊人數: parseInt(document.getElementById('teamSize').value),
        是否為標竿: document.getElementById('isBenchmark').value,
        是否為公益創投: document.getElementById('isSocialVenture').value
    };

    try {
        // 呼叫預測 API
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        };

        const response = await fetch('https://eden-foundation-api.onrender.com/predict_form', options);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('API Response:', result); // 添加日誌

        if (result.prediction) {
            const predictionResult = result.prediction[0];
            message.style.color = '#28a745';
            message.textContent = `預測結果：${predictionResult}`;

            // 回傳訊息給 LINE 使用者
            if (liff.isInClient()) {
                liff.sendMessages([
                    {
                        type: 'text',
                        text: `組織評估預測結果：${predictionResult}`
                    }
                ]).then(() => {
                    // 訊息發送成功後關閉 LIFF
                    setTimeout(() => {
                        liff.closeWindow();
                    }, 2000);
                }).catch((err) => {
                    console.error('發送訊息失敗:', err);
                    message.style.color = '#ba5757';
                    message.textContent = '發送訊息失敗，請稍後再試';
                    setTimeout(() => {
                        message.textContent = '';
                        message.style.color = '';
                    }, 3000);
                });
            } else {
                // 如果不是在 LINE 環境中，只顯示結果
                setTimeout(() => {
                    message.textContent = '';
                    message.style.color = '';
                }, 5000);
            }
        } else {
            throw new Error('無法取得預測結果');
        }
    } catch (error) {
        console.error('API Error:', error); // 添加錯誤日誌
        message.style.color = '#ba5757';
        message.textContent = `發生錯誤：${error.message}`;
        setTimeout(() => {
            message.textContent = '';
            message.style.color = '';
        }, 3000);
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        submitBtn.style.backgroundColor = '';
    }
});

function setLoadingState(isLoading) {
    const selects = document.querySelectorAll('.input-group');
    const inputs = document.querySelectorAll('input[type="text"], input[type="number"]');

    if (isLoading) {
        // 為選單添加 loading 效果
        selects.forEach(group => {
            const select = group.querySelector('select');
            select.parentElement.classList.add('loading-select');
        });

        // 為輸入框添加 loading 效果
        inputs.forEach(input => {
            input.parentElement.classList.add('loading-input');
        });

        // 禁用所有表單元素
        document.querySelectorAll('select, input, button').forEach(element => {
            element.disabled = true;
        });
    } else {
        // 移除 loading 效果
        selects.forEach(group => {
            const select = group.querySelector('select');
            select.parentElement.classList.remove('loading-select');
        });

        inputs.forEach(input => {
            input.parentElement.classList.remove('loading-input');
        });

        // 啟用所有表單元素（包含 .add-btn）
        document.querySelectorAll('select, input, button').forEach(element => {
            element.disabled = false;
        });
    }
}
