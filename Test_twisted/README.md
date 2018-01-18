# README

## Pre-install
First, ensure you can run Python from the command line :
```
python --version
```
> You should get some output like :
```
>  Python 3.6.3
```
If you do not have Python, please install the latest 3.x version from python.org.

Additionally, you’ll need to make sure you have pip available. You can check this by running:
```
pip --version
```


## Virtual environment
Install virtualenv :
```
pip install virtualenv
```


Open command line :
```
> virtualenv my_project
> source activate my_project
> pip install -r Test_twisted/requirements.txt
```

## Run the script
Now that everything is set up, you can finally launch the script.
```
python server_ws.py
```
Open a navigator and go to http://localhost:8080/. You will see the web page appear.


## How to use
Drop your file in the zone
Click on Ajouter
Check the file you want to show
Click on Start

## Others : existing issues
- ~We can't cancel a selection for the moment, we need to brush an entire axis to color all the lines again.~~~
- The program is relatively fine for files with less than 4000 lines, but above that limit it starts slowing.
- If we brush then move the column we just brushed the brushing stops.
