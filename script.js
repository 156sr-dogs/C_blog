document.addEventListener('DOMContentLoaded', () => {
    const captchaCanvas = document.getElementById('captchaCanvas');
    const mathProblemSpan = document.getElementById('mathProblem');
    const reloadCaptchaBtn = document.getElementById('reloadCaptchaBtn');
    const captchaInput = document.getElementById('captchaInput');
    const myForm = document.getElementById('myForm');

    let captchaType = 'text'; // 或者 'math'，可以根据后端返回来决定或固定

    // --- 文本型CAPTCHA的绘制函数 ---
    function drawTextCaptcha(text) {
        if (!captchaCanvas) return;
        captchaCanvas.style.display = 'block';
        mathProblemSpan.style.display = 'none';
        const ctx = captchaCanvas.getContext('2d');
        const width = captchaCanvas.width;
        const height = captchaCanvas.height;

        // 背景色
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, width, height);

        // 文本属性
        ctx.font = 'bold 30px Arial';
        ctx.fillStyle = '#333';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // 添加干扰线
        for (let i = 0; i < 5; i++) {
            ctx.strokeStyle = `rgb(${Math.random()*255},${Math.random()*255},${Math.random()*255})`;
            ctx.beginPath();
            ctx.moveTo(Math.random() * width, Math.random() * height);
            ctx.lineTo(Math.random() * width, Math.random() * height);
            ctx.stroke();
        }

        // 绘制扭曲的文本
        const chars = text.split('');
        let x = width / (chars.length + 1);
        for (let i = 0; i < chars.length; i++) {
            ctx.save();
            ctx.translate(x + (i * x), height / 2);
            ctx.rotate((Math.random() - 0.5) * 0.5); // 随机旋转角度
            ctx.fillText(chars[i], 0, 0);
            ctx.restore();
        }

        // 添加干扰点
        for (let i = 0; i < 50; i++) {
            ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.5})`;
            ctx.beginPath();
            ctx.arc(Math.random() * width, Math.random() * height, 1, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // --- 数学问题型CAPTCHA的显示函数 ---
    function displayMathCaptcha(problem) {
        if (!mathProblemSpan) return;
        captchaCanvas.style.display = 'none';
        mathProblemSpan.style.display = 'inline-block';
        mathProblemSpan.textContent = problem + " = ?";
    }

    // --- 从后端获取新的CAPTCHA ---
    async function loadCaptcha() {
        try {
            // 假设后端API端点为 /generate-captcha
            // 在实际应用中，你可能需要指定获取的类型，例如 /generate-captcha?type=text 或 /generate-captcha?type=math
            const response = await fetch('/generate-captcha'); // 后端API端点
            if (!response.ok) {
                throw new Error('无法加载CAPTCHA');
            }
            const data = await response.json();

            captchaType = data.type; // 后端应返回类型： 'text' 或 'math'
            if (data.type === 'text') {
                drawTextCaptcha(data.challenge); // data.challenge 是随机文本
            } else if (data.type === 'math') {
                displayMathCaptcha(data.challenge); // data.challenge 是数学问题字符串 "5 + 3"
            }
            captchaInput.value = ''; // 清空之前的输入
        } catch (error) {
            console.error('加载CAPTCHA失败:', error);
            if (captchaType === 'text' && captchaCanvas) {
                const ctx = captchaCanvas.getContext('2d');
                ctx.clearRect(0, 0, captchaCanvas.width, captchaCanvas.height);
                ctx.fillText('错误', captchaCanvas.width / 2, captchaCanvas.height / 2);
            } else if (mathProblemSpan) {
                mathProblemSpan.textContent = '加载错误';
            }
        }
    }

    // --- 页面加载时和点击刷新按钮时加载CAPTCHA ---
    if (reloadCaptchaBtn) {
        reloadCaptchaBtn.addEventListener('click', loadCaptcha);
    }
    loadCaptcha(); // 初始加载

    // --- 表单提交处理 (实际验证在后端) ---
    if (myForm) {
        myForm.addEventListener('submit', async function(event) {
            event.preventDefault(); // 阻止表单默认提交

            const formData = new FormData(myForm);
            const data = Object.fromEntries(formData.entries());

            try {
                // 假设后端验证API端点为 /verify-captcha
                const response = await fetch('/verify-captcha', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data) // 发送包含用户输入的表单数据
                });

                const result = await response.json();

                if (result.success) {
                    alert('验证成功！表单已提交。');
                    // 在这里处理实际的表单提交逻辑，例如发送到服务器的其他部分
                    // myForm.submit(); // 如果需要以传统方式提交
                } else {
                    alert('验证码错误，请重试。');
                    loadCaptcha(); // 重新加载CAPTCHA
                }
            } catch (error) {
                console.error('验证请求失败:', error);
                alert('验证过程中发生错误，请稍后重试。');
                loadCaptcha();
            }
        });
    }
});