# SCRIPTER 📚🗣️

[SCRIPTER](http://35.227.141.58/)는 영화와 미드의 자막을 이용해 영어 학습을 도와주는 웹 사이트입니다.<br>
자막 파일에서 대사만 추출하여 타이핑하거나 한/영 스크립트를 동시에 읽어 제공합니다.

영어 학습의 훌륭한 교보재인 자막 파일을 한/영 스크립트로써 사용하여, 영어 스피킹과 라이팅 능력을 향상시킬 수 있는 서비스 입니다.<br>
기존 자막 파일에는 대사뿐만 아니라 시간정보,마크다운 언어 등 불필요한 데이터가 많이 포함되어 있어, 사용자가 편리하게 학습할 수 있도록 불필요한 데이터를 제거해줍니다.<br>
또한, 두 개의 스크립트 파일을 동시에 볼 때 발생하는 불편함을 해결하고 진행 상황과 성취도를 가시화하여 영어 학습을 보다 편리하게 도와주기 위한 목표를 가지고 있습니다.

## 🌐 접속 주소

[http://35.227.141.58/)

- **리액트 코드**:[SCRIPTER-React](https://github.com/ksaw1228/SCRIPTER-React)

## 🔐 테스트 계정

- **ID**: test123
- **PW**: testing123!

## 🎯 주요 기능

1. 자막 파일 변환: 사용자가 영화나 미드의 자막 파일을 업로드하면, SCRIPTER는 전용 스크립트로 변환해줍니다.
2. 타이핑 연습: 변환된 영어 스크립트를 이용하여 사용자는 영어 타이핑 연습을 할 수 있습니다.
3. 한/영 스크립트 동시 제공: 실제 맥락에서 영어를 학습할 수 있도록, 한글과 영어 스크립트를 동시에 제공합니다.
4. 진행 상황 저장: 학습 진행 상황을 저장할 수 있어 더욱 편리한 학습이 가능합니다.

## 📖 사용 방법

1. 접속 주소로 이동합니다: [http://35.227.141.58/)
2. 테스트 계정으로 로그인합니다: ID: test123 / PW: testing123!
3. 'Upload' 버튼을 클릭하여 자막 파일을 업로드합니다.
4. 변환된 스크립트를 확인하고 원하는 방식으로 영어 학습을 시작하세요.

## 👨‍💻 문제 해결 사항
### 서버에서 자막 파일 처리 및 DB 저장
프로젝트 초기에는 클라이언트에서 자막 파일을 직접 처리하려 했지만, 데이터베이스 연동을 원활히 하기 위해 서버에서 처리하는 것이 필요하다고 판단되었습니다.<br>
이를 해결하기 위해 Multer 라이브러리를 사용하여 클라이언트가 업로드한 파일을 임시 저장한 후 해당 파일의 텍스트를 추출하여 데이터베이스에 저장했습니다.<br>
#### 결과적으로 서버에서 자막 처리를 함으로써 클라이언트의 부하가 줄었고, 보안상 이점을 가지게 되었고 서버 통신비용이 절감되었습니다.

### 다양한 자막 파일 형식 지원
프로젝트 초기에는 SRT 형식의 자막 파일만 지원했습니다. 하지만 다양한 형식의 자막 파일(SMI, SRT, VTT 등)이 사용되고 있음을 확인하였고,<br>
사용자 편의성을 높이기 위해 주요 형식들을 지원하기로 결정했습니다. 해결 방안으로, parseSubtitle 함수를 개선하여<br>
다양한 자막 파일 형식을 처리할 수 있도록 했습니다.<br><br>
파일의 형식에 따라 제거해야 하는 데이터가 각각 달라졌기 때문에 각 형식에 맞는 정규식을 작성하여 원하는 텍스트 부분을 추출할 수 있도록 개선했습니다.<br>
또한, 코드 구조를 모듈화하여 확장성을 확보했습니다. <br>
#### 이렇게 함으로써 다양한 자막 파일 형식을 지원하게 되어 사용자 편의성이 향상되었고, 자막 데이터 오류가 감소하며 유지보수 및 기능 추가에 용이해졌습니다.


### 진행 상황 저장 기능 개선
진행 상황 저장 기능의 필요성을 인식하여, 스크롤 위치를 저장하여 사용자가 이전에 학습한 위치에서 이어서 학습할 수 있도록 개선했습니다.<br>
스크립트를 읽는 상황에서는 .scrollTop 메서드를 사용하여 현재 스크롤 위치를 서버에 전송해 데이터베이스에 저장했습니다.<br><br>
타이핑 상황에서는 React를 사용하여 타이핑마다 div를 추가하는 방식을 사용하고있던 상황이었습니다. <br>
그에 따라 useState를 이용하여 해당 div의 부모를 찾고 부모의 lastChild를 이용해 마지막 순서를 저장하는 방법을 사용했습니다.<br>
#### 이를 통해 학습의 진행 상황과 성취도를 가시화하여 서비스를 보다 편리하게 이용할 수 있게 되었습니다.

---
### 프로젝트 구조 변경(Nest.js) 적용계획

#### ERD 설계
![ERD](https://github.com/ksaw1228/SCRIPTER/assets/48974380/6838e693-421b-4de0-aef3-d8eefc732e05)

#### 주요기능 : 자막 파싱 시퀀스 다이어그램
![시퀀스 다이어그램](https://github.com/ksaw1228/SCRIPTER/assets/48974380/27daea69-97b7-491d-95f4-081c24f8bafc)

#### 유저 플로우 : 유스케이스 다이어그램
![유스케이스 다이어그램](https://github.com/ksaw1228/SCRIPTER/assets/48974380/5c702127-9793-43da-a779-268e53f21a35)


