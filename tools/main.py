import json
import xml
import zipfile
from imp import reload
from xml.dom.minidom import parse

import os

import sys


def manifest(filepath):
    f = open('AndroidManifest.xml', 'wb')
    f.write(bytes(os.popen('java -jar APKParser.jar ' + filepath).read(), 'utf-8'))
    f.close()
    return 'AndroidManifest.xml'


def getapkfile(path):
    DOMTree = parse(path)
    collection = DOMTree.documentElement
    #name先写死，解析需要解resources.arsc文件
    apkInfo = {'build': collection.getAttribute('android:versionCode'), 'bundleID': collection.getAttribute('package'),
               'version': collection.getAttribute('android:versionName'), 'platform': 'android', 'name': 'IOTC'}
    os.system('rm AndroidManifest.xml')
    return json.dumps(apkInfo)


if __name__ == '__main__':
    print(getapkfile(manifest(sys.argv[1])))
