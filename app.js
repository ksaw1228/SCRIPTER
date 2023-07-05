const express = require('express')
const app = express()
const MongoClient = require('mongodb').MongoClient
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/image');
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, basename + '-' + Date.now() + ext);
  }
});
const upload = multer({ storage: storage });
const crypto = require('crypto')
const session = require('express-session')
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
require('dotenv').config();

function parseSubtitle(data, fileExtension) {
  if (fileExtension === 'smi') {
      data = data.replace(/&nbsp;/gi, ' ');
      data = data.replace(/<br>/gi, '\u200B');
      data = data.replace(/<.*?>/g, '');
      data = data.replace(/ /gi, '');
      data = data.replace(/<!--[\s\S]*?-->/g, '');
      data = data.replace(/\u200B/gi, ' ');
  }

  const lines = fileExtension === 'srt'
      ? data.trim().split(/\r?\n\r?\n/)
      : data.split('\n');

  return lines.reduce((acc, item, index) => {
      const content = fileExtension === 'srt'
          ? item.split(/\r?\n/).slice(2).join(' ').replace(/<\/?[^>]+(>|$)/g, '')
          : item.trim();

      // Check if line is a time code
      const isTimeCode = /^\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}/.test(content);
      // Check if line is a number right above a time code (in srt format)
      const isNumberAboveTimeCode = /^\d+$/.test(content) && /^\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}/.test(lines[index + 1]);

      if (content && /\S/.test(content) && !isTimeCode && !isNumberAboveTimeCode) {
          const cleaned = content.replace(/<[\s\S]*?>/g, '').replace(/^\([^)]*\)/, '').trim();
          if (cleaned) {
            acc.push(cleaned);
          }
      }
      return acc;
  }, []);
}

app.set('view engine', 'ejs')
var db;
app.use(session({secret : process.env.SESSION_PW, resave : true, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session()); 
app.use(express.json());
app.use(express.urlencoded({extended: false}));
var cors = require('cors');

app.use(cors());
app.use( '/', express.static( path.join(__dirname, 'public') ))
app.use( '/react', express.static( path.join(__dirname, 'react-front/build') ))

//패스포트 유저인증
passport.use(new LocalStrategy({
  usernameField: 'id',
  passwordField: 'pw',
  session: true,
  passReqToCallback: false,
}, function (inputID, inputPW, done) {
  db.collection('user').findOne({ id: inputID }, function (err, data) {
    if (err) return done(err)
    if (!data) return done(null, false, { message: '존재하지않는 아이디요' })
    if (crypto.createHash('sha512').update(inputPW).digest('base64') == data.pw) {
      return done(null, data)
    } else {
      return done(null, false, { message: '비번틀렸어요' })
    }
  })
}));
passport.serializeUser(function (user, done) {
  done(null, user.id)
});
passport.deserializeUser(function (아이디, done) {
  db.collection('user').findOne({ id: 아이디 }, function (에러, 결과) {
    done(null, 결과)
  })
}); 
MongoClient.connect(process.env.MONGO_DB_URL,(err,client) => {
    if(err){return console.log(err)}
    db=client.db('subtitle')
    app.listen(process.env.PORT,()=>{
        console.log(process.env.PORT+"on")
    })
})

app.get('/', (req, res) => {
  res.render('reindex.ejs')
});

app.get('/contect',(req,res) => {
  res.render('contect.ejs')
})

app.post('/contect',(req,res) => {
    console.log(req.body.contect)
    db.collection('contect').insertOne({text:req.body.contect}, (err, result) => {
      res.redirect('/contect')
    });
})

app.get('/login',(req,res) => {
    if (req.isAuthenticated()) {
      res.redirect('/main')
    }else{
    res.render('index.ejs')
    }
})

app.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      res.status(500).json({ success: false, message: '인증에 실패하였습니다.' });
    } else if (!user) {
      res.status(401).json({ success: false, message: info.message });
    } else {
      req.logIn(user, (err) => {
        if (err) {
          res.status(500).json({ success: false, message: '로그인 중 오류가 발생하였습니다.' });
        } else {
          res.status(200).json({ success: true, message: '로그인에 성공하였습니다.' });
        }
      });
    }
  })(req, res, next);
});

app.get('/join',(req,res) => {
  if (req.isAuthenticated()) {
    res.redirect('/')
  }else{
  res.render('join.ejs')
  }
})

app.post('/join', (req, res) => {
  db.collection('user').findOne({ id: req.body.id }, (err, user) => {
    if (err) {
      console.error(err);
      res.status(500).send("서버 에러");
    } else if (user) {
      // 이미 존재하는 사용자 ID인 경우
      res.status(409).send("이미 사용 중인 아이디입니다."); 
    } else {
      // 중복 아이디 없을 경우, 회원 정보 저장
      db.collection('user').insertOne({ id: req.body.id, pw: crypto.createHash('sha512').update(req.body.pw).digest('base64') }, (err, result) => {
        if (err) {
          console.error(err);
          res.status(500).send("회원 가입에 실패하였습니다."); 
        } else {
          res.status(200).json({ success: true, message: "회원가입에 성공하였습니다." });
        }
      });
    }
  });
});

//비로그인유저 접근금지 미들웨어
app.use((req,res,next) => {
  if (req.isAuthenticated()) {
    return next();
  }else{
    res.send("<script>alert('로그인을 해주세요!'); location.href = '/';</script>")
  }
})

app.post('/upimage', upload.single('file'), (req, res) => {
  const ObjectId = require('mongodb').ObjectId;
  const id =ObjectId(req.body.id)
  const name =(req.file.filename)
  db.collection('contents').updateOne( {_id : ObjectId(id)}, {$set : { image: name }}, function(){
    res.status(200).send("저장완료");
  })
});

app.post('/upload', upload.array('userFile', 2), (req, res) => {
  // 첫 번째 파일 처리
  const fileName1 = req.files[0].originalname;
  const lastIndex1 = fileName1.lastIndexOf('.');
  const fileExtension1 = fileName1.substring(lastIndex1 + 1);

  fs.readFile(req.files[0].path, 'utf8', (err, data1) => {
    if (err) {
      console.error(err);
      return res.status(500).send(err);
    }

    // 두 번째 파일 처리
    const fileName2 = req.files[1].originalname;
    const lastIndex2 = fileName2.lastIndexOf('.');
    const fileExtension2 = fileName2.substring(lastIndex2 + 1);

    fs.readFile(req.files[1].path, 'utf8', (err, data2) => {
      if (err) {
        console.error(err);
        return res.status(500).send(err);
      }

      // 정규식으로 자막 파싱
      let subtitle1 = parseSubtitle(data1, fileExtension1);
      let subtitle2 = parseSubtitle(data2, fileExtension2);

      // DB에 자막 저장
      db.collection('contents').insertOne(
        { user: req.user._id, title: req.body.subtitleId, text: subtitle1, Rtext: subtitle2 ,loadCount: 0, loadScroll1:0, loadScroll2:0, topValue: [], image:"" }
      , function (error, result) {
        console.log('저장 완료');

        // DB에 저장 후 서버에 업로드된 파일 삭제.
        fs.unlink(req.files[0].path, (err) => {
          if (err) {
            console.error(err);
            return res.status(500).send(err);
          }
        });
        fs.unlink(req.files[1].path, (err) => {
          if (err) {
            console.error(err);
            return res.status(500).send(err);
          }
        });
        // 업로드 후 리다이렉트
        res.redirect('/main');
      });
    });
  });
});

app.get('/main',(req,res) => {
    db.collection('contents').find({user : req.user._id}).toArray((err,data) => {
      res.render('subList.ejs',{data : data})
  })
})

app.get('/react/:id', function(요청,응답){
    응답.sendFile( path.join(__dirname, 'react-front/build/index.html') )
  })

app.get('/script/:id', (req, res) => {
  const ObjectId = require('mongodb').ObjectId;
  const id =ObjectId(req.params.id)
  db.collection('contents').findOne({_id : id},(err,data) => {
    const result = {
      text:data.text,
      Rtext:data.Rtext,
      loadScroll1:data.loadScroll1,
      loadScroll2:data.loadScroll2,
    }
    res.render('justscript.ejs',{data:result})
  })
});

app.get('/api/:id', (req, res) => {
  const ObjectId = require('mongodb').ObjectId;
  db.collection('contents').findOne({ _id: ObjectId(req.params.id) }, (err, data) => {
    if (err) {
      console.error(err);
    } else {
      const result = {
        text: data.text,
        Rtext: data.Rtext,
        loadCount: data.loadCount,
        topValue: data.topValue
      };
      res.json(result);
    }
  });
});

app.post('/save',(req,res) => {
  const { _id, loadCount, topValue } = req.body;
  const ObjectId = require('mongodb').ObjectId;
  db.collection('contents').updateOne( {_id : ObjectId(_id)}, {$set : { loadCount: loadCount, topValue:topValue }}, function(){
    res.status(200).send("저장완료");
    });
})

app.post('/saveScroll',(req,res) => {
  const { id, loadScroll1, loadScroll2 } = req.body;
  console.log(loadScroll1)
  console.log(loadScroll2)
  const ObjectId = require('mongodb').ObjectId;
  db.collection('contents').updateOne( {_id : ObjectId(id)}, {$set : { loadScroll1: loadScroll1, loadScroll2:loadScroll2 }}, function(){
    res.status(200).send("저장완료");
  })
})

app.post('/logout', (req, res) => {
  req.logout(function(err) {``
    if (err) {
      return res.status(500).send({ message: '로그아웃 실패했습니다.' });
    }
    return res.redirect('/')
  });
});

app.delete('/delete',(req,res) => {
  const ObjectId = require('mongodb').ObjectId;
  const id =ObjectId(req.body.id)
  db.collection('contents').deleteOne({_id:id},(err,data) => {
    res.status(200).send("삭제에 성공했습니다");
  })
})