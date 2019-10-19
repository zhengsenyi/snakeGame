if(window.innerWidth > 568){
    var sw = 20, //一个方块的宽
    sh = 20, //一个方块的高
    tr = 25, //行数
    td = 32; //列数
}else{
    var sw = 18, //一个方块的宽
    sh = 18, //一个方块的高
    tr = 15, //行数
    td = 20; //列数
}
var snake = null, //蛇的实例
    food = null, //食物的实例
    game = null; //游戏的实例

function Square(x,y,classname){
    this.x = x * sw;
    this.y = y * sh;
    this.class = classname;
    this.viewContent = document.createElement('div'); //方块对应的DOM元素
    this.viewContent.className = this.class;
    this.parent = document.getElementById('snakeWrap'); //方块的父级
}
Square.prototype.create = function(){//创建方块
    this.viewContent.style.position = 'absolute';
    this.viewContent.style.width = sh + 'px';
    this.viewContent.style.height = sw + 'px';
    this.viewContent.style.left = this.x + 'px';
    this.viewContent.style.top = this.y + 'px';
    this.parent.appendChild(this.viewContent);
}
Square.prototype.remove = function(){
    this.parent.removeChild(this.viewContent);
}

//蛇
function Snake(){
    this.head = null; //保存蛇头的信息
    this.tail = null; //保存蛇尾的信息
    this.pos = []; //保存蛇身每个方块的信息
    this.directionNum = { //保存蛇走的方向
        left : {
            x : -1,
            y : 0,
            rotate : 180 //蛇头在不同方向的旋转方向
        },
        right : {
            x : 1,
            y : 0,
            rotate : 0
        },
        up : {
            x : 0,
            y : -1,
            rotate : -90
        },
        down : {
            x : 0,
            y : 1,
            rotate : 90
        }
    }
}
Snake.prototype.init = function(){
    //创建蛇头
    var snakeHead = new Square(2,0,'snakeHead');
    snakeHead.create();
    this.head = snakeHead; //保存蛇头信息
    this.pos.push([2,0]); //保存蛇头的位置坐标信息
    //创建蛇身体1
    var snakeBody1 = new Square(1,0,'snakeBody');
    snakeBody1.create();
    this.pos.push([1,0]); //保存蛇身1的位置坐标信息
    //创建蛇身体2
    var snakeBody2 = new Square(0,0,'snakeBody');
    snakeBody2.create();
    this.tail = snakeBody2; //保存蛇尾信息
    this.pos.push([0,0]); //保存蛇身2的位置坐标信息

    //形成链表关系
    snakeHead.last = null;
    snakeHead.next = snakeBody1;

    snakeBody1.last = snakeHead;
    snakeBody1.next = snakeBody2;

    snakeBody2.last = snakeBody1;
    snakeBody2.next = null;

    //添加一条属性表示蛇走的方向
    this.direction = this.directionNum.right; //默认往右走
}
var scoreDiv = document.querySelector('.score');
//获取蛇头下一个位置对应的元素，并且根据元素做不同的事情
Snake.prototype.getNextPos = function(){
    var nextPos = [ //蛇头要走的下个点的坐标
        this.head.x/sw + this.direction.x,
        this.head.y/sh + this.direction.y
    ]
    
    //下个点是自己，代表撞到自己，游戏结束
    var selfCollied = false;
    this.pos.forEach(function(value){
        if(value[0] == nextPos[0] && value[1] == nextPos[1]){
            //值相等，表示下个点在蛇身上，代表撞到自己
            selfCollied = true;
        }
    });
    if(selfCollied){
        this.strategies.die();
        return;
    }
    //下个点是墙，游戏结束
    if(nextPos[0] < 0 || nextPos[1] < 0 || nextPos[0] > td-1 || nextPos[1] > tr-1){
        this.strategies.die();
        return;
    }
    //下个点是食物，吃，身体变长
    if(food && food.pos[0] == nextPos[0] && food.pos[1] == nextPos[1]){
        //条件成立说明蛇头碰到食物，进行吃操作，蛇身边长
        this.strategies.eat.call(this);
        game.score ++;
        scoreDiv.innerHTML = game.score;
        return;
    }
    //下个点什么都不是，走
    this.strategies.move.call(this);
}

//处理碰撞后的事情
Snake.prototype.strategies = {
    move : function(format){ //这个参数决定要不要删除蛇尾，传了代表吃的操作
        //创建新身体（在旧蛇头的位置）
        var newBody = new Square(this.head.x/sw,this.head.y/sh,'snakeBody');
        //更新链表关系
        newBody.next = this.head.next;
        newBody.next.last = newBody;
        newBody.last = null;

        this.head.remove(); //把旧蛇头移除
        newBody.create();

        //创建一个新蛇头（在下一步的位置）
        var newHead = new Square(this.head.x/sw + this.direction.x,this.head.y/sh + this.direction.y,'snakeHead')
        //更新链表关系
        newHead.next = newBody;
        newHead.last = null;
        newBody.last = newHead;
        newHead.viewContent.style.transform = 'rotate('+this.direction.rotate+'deg)';
        newHead.create();

        //蛇身上的每一个方块的坐标要更新
        this.pos.splice(0,0,[this.head.x/sw + this.direction.x,this.head.y/sh + this.direction.y]);
        this.head = newHead; //把this.head的信息更新一下

        if(!format){ //如果format的值为false，表示需要删除（吃到食物除外）
            this.tail.remove();
            this.tail = this.tail.last;
            this.pos.pop();
        }
    },
    eat : function(){
        this.strategies.move.call(this,true);
        createFood();
    },
    die : function(){
        game.over();
    }
}
snake = new Snake();

//创建食物
function createFood(){
    //食物方块的随机坐标
    var x = null;
    var y = null;
    var include = true; //循环终止跳出条件，true表示食物在蛇身上（需要继续循环）。false表示不在蛇身上（不循环）。
    while(include){
        x = Math.round(Math.random()*(td - 1));
        y = Math.round(Math.random()*(tr - 1));
        snake.pos.forEach(function(value){
            if(x != value[0] && y != value[1]){
                //条件成立代表随机出来的坐标不在蛇身上
                include = false;
            }
        });
    }

    //生成食物
    food = new Square(x,y,'food');
    food.pos = [x,y]; //保存食物的坐标，判断蛇头是否碰到食物
    var foodDom = document.querySelector('.food');
    if(foodDom){
        foodDom.style.left = x * sw + 'px';
        foodDom.style.top = y * sh + 'px';
    }else{
        food.create();
    }
}

//创建游戏逻辑
function Game(){
    this.timer = null;
    this.score = 0;
}
//获取手机按键
var left = document.querySelector('.mBtn.left');
var right = document.querySelector('.mBtn.right');
var up = document.querySelector('.mBtn.up');
var down = document.querySelector('.mBtn.down');
var level = null;
Game.prototype.init = function (){
    snake.init();
    //snake.getNextPos();
    createFood();
    document.onkeydown = function (e){
        if(e.which == 37 && snake.direction != snake.directionNum.right){
            snake.direction = snake.directionNum.left;
        }else if(e.which == 38 && snake.direction != snake.directionNum.down){
            snake.direction = snake.directionNum.up;
        }else if(e.which == 39 && snake.direction != snake.directionNum.left){
            snake.direction = snake.directionNum.right;
        }else if(e.which == 40 && snake.direction != snake.directionNum.up){
            snake.direction = snake.directionNum.down;
        }
    }
    //手机按键事件
    left.onclick = function(){
        if(snake.direction != snake.directionNum.right){
            snake.direction = snake.directionNum.left;
        }
    }
    up.onclick = function(){
        if(snake.direction != snake.directionNum.down){
            snake.direction = snake.directionNum.up;
        }
    }
    right.onclick = function(){
        if(snake.direction != snake.directionNum.left){
            snake.direction = snake.directionNum.right;
        }
    }
    down.onclick = function(){
        if(snake.direction != snake.directionNum.up){
            snake.direction = snake.directionNum.down;
        }
    }
    this.start();
    scoreDiv.innerHTML = game.score;
}
Game.prototype.start = function(){ //开始游戏
    this.timer = setInterval(function(){
        snake.getNextPos();
    },level);
}
Game.prototype.pause = function(){
    clearInterval(this.timer);
}
Game.prototype.over = function(){
    clearInterval(this.timer);
    alert('游戏结束，你的得分为：' + this.score);
    //游戏初始化
    var snakeWrap = document.getElementById('snakeWrap');
    snakeWrap.innerHTML = '';
    snake = new Snake();
    game = new Game();

    var startBtnWrap = document.querySelector('.startBtn');
    startBtnWrap.style.display = 'block';
}

//开始游戏
game = new Game();
var startBtn = document.querySelector('.startBtn button');
var levelBtn = document.querySelector('.btn1');
var easy = levelBtn.children[0];
var medium = levelBtn.children[1];
var difficult = levelBtn.children[2];
startBtn.onclick = function(){
    startBtn.parentNode.style.display = 'none';
    //游戏难度选择出现
    levelBtn.style.display = 'block';
    //简单
    easy.onclick = function(){
        this.parentNode.style.display = 'none';
        level = 300;
        game.init();
    }
    //中等
    medium.onclick = function(){
        this.parentNode.style.display = 'none';
        level = 200;
        game.init();
    }
    //困难
    difficult.onclick = function(){
        this.parentNode.style.display = 'none';
        level = 100;
        game.init();
    }
}

//暂停游戏
var snakeWrap = document.getElementById('snakeWrap');
var pauseBtn = document.querySelector('.pauseBtn button');
snakeWrap.onclick = function(){
    game.pause();
    pauseBtn.parentNode.style.display = 'block';
}
pauseBtn.onclick = function(){
    game.start();
    this.parentNode.style.display = 'none';
}
