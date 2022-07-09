A. Node.js 설치
	- https://nodejs.org 에서 다운 후 설치

B. Angular 설치
	- npm install -g @angular/cli

C. node_modules 설치
	- npm install

D. 빌드
	- 용도에 따라 D.1, D.2, D.3 중 선택하여 진행
	- 해당 코드는 HOMP 와 Peer Client 모두 사용되는 코드로 빌드 시 아래와 같이 설정하여 빌드 진행 
		- HOMP : app.module.ts 의 line.34 주석 해제, app.module.ts 의 line.35 주석
		- Peer Client : app.module.ts 의 line.34 주석, app.module.ts 의 line.35 주석 해제
	D.1. 개발용 (proxy 이용) 
			- proxy.conf.js 파일 수정
				- target 에 proxy 서버 연결 정보 입력
			- npm start		
	D.2. 개발용 (Web 서버 이용)
			- npm run-script debug
	D.3. 배포용    
			- npm run-script build

E. 배포
	- 빌드 성공시 ../dist 위치에 빌드 결과물이 생성됨
	- 생성된 파일을 webClient 폴더에 복사함
			

특이사항 - 5번 꼭 필요 나머지는 이미 설치됨
	1. devextreme 설치
		- npm install devextreme@19.2 devextreme-angular@19.2 --save --save-exact
			- tsconfig.json 파일 compilerOptions 안에 추가
				"paths": {
					"jszip": [
						"node_modules/jszip/dist/jszip.min.js"
					]
				}
	2. flex-layout 설치
    	- npm i -s @angular/flex-layout @angular/cdk
	3. D3 추가
		- angular.json 에서 "architect" > "build" 에 내용 추가
		"scripts": [
				"node_modules/d3/d3.min.js"
				]
	4.  budgets 용량 수정
		- angular.json 에서 
		"budgets": [
					{
					"type": "initial",
					"maximumWarning": "7mb",
					"maximumError": "10mb"
					}
				]
	5. plotlyjs 버그 수정
		- plotly.js/dist/plotly.js 수정 var d3_document = this.document; 문제 => }(); to }.apply(self);