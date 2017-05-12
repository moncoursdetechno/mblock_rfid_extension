(function(ext) {
    var device = null;
    var _rxBuf = [];

    
	var levels = {
		HIGH:1,
		LOW:0
	};
	var pins = {
		"D2":2,
		"D3":3,
		"D4":4,
		"D5":5,
		"D6":6,
		"D7":7,
		"D8":8,
		"A0":0,
		"A1":1,
		"A2":2,
		"A3":3
	};
	var values = {};
	var indexs = [];
	
	var versionIndex = 0xFA;
    
	ext.resetAll = function(){};
	
	ext.runArduino = function(){
		
	};
	ext.digitalWrite = function(label, pin, level) {
        runPackage(30,typeof pin=="number"?pin:pins[pin],typeof level=="number"?level:levels[level]);
    };
	ext.digitalRead = function(nextID, label, pin) {
		getPackage(nextID,30,typeof pin=="number"?pin:pins[pin]);
	};
	ext.analogRead = function(nextID, label, pin) {
		getPackage(nextID,31,typeof pin=="number"?pin:pins[pin]);
	};
	ext.analogWrite = function(label, pin, pwm) {
        runPackage(32,typeof pin=="number"?pin:pins[pin],pwm);
    };
	//Arduino map() implementation
	ext.map = function(nextID, val, in_min, in_max, out_min, out_max) {
		var newVal = ( val - in_min ) * ( out_max - out_min ) / ( in_max - in_min ) + out_min;
		responseValue(nextID, newVal);//Ne fonctionne pas (limitation de mBlock)
	};
	ext.timerRead = function(nextID){
		getPackage(nextID, 50);
	};
	//Timer reset
	ext.timerWrite = function(nextID){
		runPackage(50);
	};
	//Afficheur 7 segments
	ext.sevSegDisplayWrite = function (val, pin, dots) {
		runPackage(9,typeof pin=="number"?pin:pins[pin], Math.floor(val/100), val%100, dots=="afficher"?1:0);
	};
  //Afficheur i2c
	ext.i2cDisplayWrite = function (text, line) {
    var charCodes = [];//char splitted string
    var len = String(text).length;
    for(var i=0;i<len;i++) {
      charCodes.push(String(text).charCodeAt(i));
    }
    var port = 0; //dummy port
    runPackage(42, port, line, String(text).length, charCodes);
	};
  //DHT 11
	ext.dhtTemperatureRead = function (nextID, pin) {
		getPackage(nextID, 43,typeof pin=="number"?pin:pins[pin]);
	};
  ext.dhtHumidityRead = function (nextID, pin) {
		getPackage(nextID, 44,typeof pin=="number"?pin:pins[pin]);
	};
  //GROV49 v1.2
  ext.temperatureRead = function (nextID, pin) {
		getPackage(nextID, 2,typeof pin=="number"?pin:pins[pin]);
	};
  //Joystick GROV78
  ext.joystickRead = function (nextID, slot, pin) {
    //Analog read
    var pinX = typeof pin=="number"?pin:pins[pin];
    var pinY = pinX+1;
    if(slot == "de l'axe X")
    {
      getPackage(nextID,31,pinX);//ANALOG
    }
    else if(slot == "de l'axe Y")
    {
      getPackage(nextID,31,pinY);//ANALOG
    }
    else
    {
      getPackage(nextID, 5, pinX);//JOYSTICK
    }
  };
  // RFID
  ext.rfidRead = function (nextID, pin) {
    getPackage(nextID, 51, typeof pin=="number"?pin:pins[pin]); // RFID
  };
  // HC08
  ext.hc08Name = function (nextID, pin) {
    getPackage(nextID, 52, typeof pin=="number"?pin:pins[pin]); // HC08
  };
  // HC08
  ext.hc08Password = function (nextID, pin) {
    getPackage(nextID, 53, typeof pin=="number"?pin:pins[pin]); // HC08
  };
  // HC08
  ext.hc08Read = function (nextID, pin) {
    getPackage(nextID, 54, typeof pin=="number"?pin:pins[pin]); // HC08
  };
  // HC08
  ext.hc08Write = function (nextID, pin) {
    getPackage(nextID, 55, typeof pin=="number"?pin:pins[pin]); // HC08
  };
    //Servo angle
  ext.servoAngleWrite = function (pin, val, speed)
  {
    runPackage(45, typeof pin=="number"?pin:pins[pin], val, speed);//SERVO_ANGLE
  };
  //Servo continu
  ext.servoContWrite = function (pin, val, dir, trim)
  {
    trim = 90 + trim;
    runPackage(46, typeof pin=="number"?pin:pins[pin], val, dir=="inverse"?1:0, trim);//SERVO_CONT
  };
  //IR
  ext.irRead = function (nextID, pin)
  {
    getPackage(nextID, 13, typeof pin=="number"?pin:pins[pin]);//IR
  };
  //RGB Led
  ext.rgbLedWrite = function (index, pin, red, green, blue)
  {
    runPackage(8, typeof pin=="number"?pin:pins[pin], index, red, green, blue);//RGB Led
  };
  //Led bar
  ext.ledBarWrite = function (level, pin)
  {
    runPackage(48, typeof pin=="number"?pin:pins[pin], level);
  };
  
	/*******************************
	********************************
	*******************************/
	function runPackage(){
		var bytes = [];
		bytes.push(0xff);
		bytes.push(0x55);
		bytes.push(0);
		bytes.push(0);
		bytes.push(2);
		for(var i=0;i<arguments.length;i++){
      if(Array.isArray(arguments[i])) {
				bytes = bytes.concat(arguments[i]);
			} else {
        bytes.push(arguments[i]);
      }
		}
		bytes[2] = bytes.length-3;
		device.send(bytes);
	}
	function getPackage(){
		var bytes = [];
		bytes.push(0xff);
		bytes.push(0x55);
		bytes.push(arguments.length+1);
		bytes.push(arguments[0]);//0
		bytes.push(1);
		for(var i=1;i<arguments.length;i++){
			bytes.push(arguments[i]);
		}
		device.send(bytes);
	}

  var inputArray = [];
	var _isParseStart = false;
	var _isParseStartIndex = 0;
    function processData(bytes) {
		var len = bytes.length;
		if(_rxBuf.length>30){
			_rxBuf = [];
		}
		for(var index=0;index<bytes.length;index++){
			var c = bytes[index];
			_rxBuf.push(c);
			if(_rxBuf.length>=2){
				if(_rxBuf[_rxBuf.length-1]==0x55 && _rxBuf[_rxBuf.length-2]==0xff){
					_isParseStart = true;
					_isParseStartIndex = _rxBuf.length-2;
				}
				if(_rxBuf[_rxBuf.length-1]==0xa && _rxBuf[_rxBuf.length-2]==0xd&&_isParseStart){
					_isParseStart = false;
					
					var position = _isParseStartIndex+2;
					var extId = _rxBuf[position];
					position++;
					var type = _rxBuf[position];
					position++;
					//1 byte 2 float 3 short 4 len+string 5 double
					var value;
					switch(type){
						case 1:{
							value = _rxBuf[position];
							position++;
						}
							break;
						case 2:{
							value = readFloat(_rxBuf,position);
							position+=4;
							if(value<-255||value>1023){
								value = 0;
							}
						}
							break;
						case 3:{
							value = readShort(_rxBuf,position);
							position+=2;
						}
							break;
						case 4:{
							var l = _rxBuf[position];
							position++;
							value = readString(_rxBuf,position,l);
						}
							break;
						case 5:{
							value = readDouble(_rxBuf,position);
							position+=4;
						}
							break;
					}
					if(type<=5){
						if(values[extId]!=undefined){
							responseValue(extId,values[extId](value));
						}else{
							responseValue(extId,value);
						}
						values[extId] = null;
					}
					_rxBuf = [];
				}
			} 
		}
    }
	function readFloat(arr,position){
		var f= [arr[position],arr[position+1],arr[position+2],arr[position+3]];
		return parseFloat(f);
	}
	function readShort(arr,position){
		var s= [arr[position],arr[position+1]];
		return parseShort(s);
	}
	function readDouble(arr,position){
		return readFloat(arr,position);
	}
	function readString(arr,position,len){
		var value = "";
		for(var ii=0;ii<len;ii++){
			value += String.fromCharCode(_rxBuf[ii+position]);
		}
		return value;
	}
    function appendBuffer( buffer1, buffer2 ) {
        return buffer1.concat( buffer2 );
    }

    // Extension API interactions
    var potentialDevices = [];
    ext._deviceConnected = function(dev) {
        potentialDevices.push(dev);

        if (!device) {
            tryNextDevice();
        }
    }

    function tryNextDevice() {
        // If potentialDevices is empty, device will be undefined.
        // That will get us back here next time a device is connected.
        device = potentialDevices.shift();
        if (device) {
            device.open({ stopBits: 0, bitRate: 115200, ctsFlowControl: 0 }, deviceOpened);
        }
    }

    function deviceOpened(dev) {
        if (!dev) {
            // Opening the port failed.
            tryNextDevice();
            return;
        }
        device.set_receive_handler('ts',function(data) {
            processData(data);
        });
    };

    ext._deviceRemoved = function(dev) {
        if(device != dev) return;
        device = null;
    };

    ext._shutdown = function() {
        if(device) device.close();
        device = null;
    };

    ext._getStatus = function() {
        if(!device) return {status: 1, msg: 'demo disconnected'};
        return {status: 2, msg: 'demo connected'};
    }

    var descriptor = {};
	ScratchExtensions.register('ts', descriptor, ext, {type: 'serial'});
})({});
