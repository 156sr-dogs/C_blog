# app.py (Python/Flask 示例)
from flask import Flask, request, jsonify, session, render_template, send_from_directory
import random
import string

app = Flask(__name__, static_folder='.', static_url_path='') # 为了能直接访问index.html等

# Session配置 (Flask默认使用安全的cookie-based session)
app.secret_key = 'your-very-secret-flask-key' # 替换为强密钥

# --- CAPTCHA 生成函数 ---
def generate_random_text(length=6):
    characters = string.ascii_uppercase + string.digits
    return ''.join(random.choice(characters) for _ in range(length))

def generate_math_problem():
    num1 = random.randint(1, 10)
    num2 = random.randint(1, 10)
    operations = ['+', '-'] # 可以扩展
    operation = random.choice(operations)
    
    if operation == '+':
        answer = num1 + num2
        problem = f"{num1} + {num2}"
    else: # '-'
        if num1 < num2: # 确保结果非负（可选简化）
            answer = num2 - num1
            problem = f"{num2} - {num1}"
        else:
            answer = num1 - num2
            problem = f"{num1} - {num2}"
            
    return {"problem": problem, "answer": answer}

# --- CAPTCHA 生成API端点 ---
@app.route('/generate-captcha')
def generate_captcha_route():
    captcha_type = request.args.get('type', random.choice(['text', 'math']))
    
    challenge_data = {}
    if captcha_type == 'text':
        text_challenge = generate_random_text()
        session['captcha_answer'] = text_challenge
        challenge_data = {'type': 'text', 'challenge': text_challenge}
    else: # math
        math_data = generate_math_problem()
        session['captcha_answer'] = str(math_data['answer'])
        challenge_data = {'type': 'math', 'challenge': math_data['problem']}
        
    print(f"Generated CAPTCHA: Type={challenge_data['type']}, Challenge='{challenge_data['challenge']}', Answer='{session['captcha_answer']}'")
    return jsonify(challenge_data)

# --- CAPTCHA 验证API端点 ---
@app.route('/verify-captcha', methods=['POST'])
def verify_captcha_route():
    data = request.get_json()
    user_input = data.get('captchaInput')
    stored_answer = session.get('captcha_answer')

    print(f"Verifying: UserInput='{user_input}', StoredAnswer='{stored_answer}'")

    if user_input and stored_answer and user_input.lower() == stored_answer.lower():
        session.pop('captcha_answer', None) # 验证成功后清除
        return jsonify({'success': True, 'message': '验证成功'})
    else:
        return jsonify({'success': False, 'message': '验证码错误'})

# --- 服务前端静态文件 ---
@app.route('/')
def index():
    return send_from_directory('.', 'index.html') # 确保index.html在根目录

@app.route('/<path:filename>')
def static_files(filename):
    return send_from_directory('.', filename)


if __name__ == '__main__':
    app.run(debug=True, port=5000) # 使用不同于Node.js的端口以便同时测试