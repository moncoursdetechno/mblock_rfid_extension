#include <SoftwareSerial.h>

#ifndef RFID_H
#define RFID_H

String _strTagTmp, _strTag;
char _c;
SoftwareSerial * _RFID;
boolean _blInit = false;

boolean VerifierCheckSum(String strTag) {
	unsigned int b1,b2,b3,b4,b5,checksum;
	char charBuf[13];
	strTag.toCharArray(charBuf, 13); 
	sscanf(charBuf , "%2x%2x%2x%2x%2x%2x", &b1, &b2, &b3, &b4, &b5, &checksum);

	if ( (b1 ^ b2 ^ b3 ^ b4 ^ b5) == checksum ) {
		return true;
	} else {
		return false;
	} 
}

boolean initRFID(int pin){
	_RFID = new SoftwareSerial(pin , 255);
	_RFID->begin(9600); 
	return true;
}

String getValueRFID(int pin){
	if (!_blInit){
		_blInit = initRFID(pin);
	}   

	_strTag = "";
	_RFID->listen();
	if (_RFID->isListening()){ 
		while (_RFID->available() > 0){ 
			_c = _RFID->read();
			_strTagTmp += _c;
			if (_strTagTmp.length() == 14){
				if ((_strTagTmp[0]==2) && (_strTagTmp[13]==3)){
					_strTagTmp = _strTagTmp.substring(1,13);
					if (VerifierCheckSum(_strTagTmp) == true){
						_strTag = _strTagTmp;
					}
				}
				_strTagTmp= "";
			}
		}
	}

	if (_strTag != ""){
		return _strTag;
	} else {
		return "";
	}
}

#endif