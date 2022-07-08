# Q.4103   

## HOMS

### Pre-requisite
- mysql(or maria) DBMS
### Usage
1. Import 'HOMS/hp2p_2020.sql' file into DBMS 
2. Create venv
```
- Windows
> cd HOMS/HompServer
> python3 -m venv venv
> venv\Scripts\activate.bat
(venv) > pip3 install -r requirements.txt

- Linux/MacOS
$ cd HOMS/HompServer
$ python3 -m venv venv
$ source ./venv/bin/activate
$ pip3 install -r requirements.txt
```
3. Edit configurations   
* DB : edit the 'DATABASE_CONFIG' part of the 18th line of the 'HOMS/HompServer/config.py' file.
* Edit necessary parts such as Web access port, WS port.
4. Run
```
- Windows
> cd HOMS/HompServer
> venv\Scripts\activate.bat
(venv) > python3 homs_run.py

- Linux/MacOS
$ cd HOMS/HompServer
$ source ./venv/bin/activate
$ python3 homs_run.py
```


## Web UI (Server + Peer)   
### Pre-requisite
- node
### Usage
1. Build   
  1.1. Install required libraries   
   - angular   
     ```
     $npm install -g @angular/cli
     ```
   1.2. node_module
   ```
   $cd WebUI
   $npm install  
   ```
   1.3. Fix lib bug   
   Change '();' to '.apply(self);' after the closing brace of the function that includes 'var d3_document = this.document;' in file 'WebUI/node_modules/plotly.js/dist/plotly.js'
   ```
   !function() {  // !function
     var d3 = {
       version: "3.5.17"
     };
     var d3_arraySlice = [].slice, d3_array = function(list) {
       return d3_arraySlice.call(list);
     };
     var d3_document = this.document;  // !function that includes this line.
     function d3_documentElement(node) {
       return node && (node.ownerDocument || node.document || node).documentElement;
     }

     ...

     //}();         // edit this part
     }.apply(self); // to this
   ```
   1.4. Choose Server/Peer   
   Edit the 34~35th lines of the 'WebUI/src/app/app.module.ts'
   - Uncomment line 34, comment line 35 for build Server Web UI
   - Uncomment line 35, comment line 34 for build Peer Web UI
   
   1.5. Build by purpose
   - Develop (use proxy)
     - Edit WebUI/proxy.conf.js   
     Enter proxy server connection information in 'target'
     - Rue
       ```
       $npm start
       ```
   - Develop (use Web Server)
     ```
     $npm run-script debug
     ```
   - Distribution
     ```
     $npm run-script build
     ```
     Copy all directorys/files in 'WebUI/dist' into 'Peer/webClient(in case of Server, HOMS/HompServer/static)' when the build is complete.   
     All directorys/files in the existing folder are deleted before copying.

## LICENSE

The MIT License

Copyright (c) 2022 ETRI

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.