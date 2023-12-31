<!-- markdownlint-disable no-inline-html first-line-h1 -->

<div align="center">
  <a href="https://www.tradingview.com/lightweight-charts/" target="_blank">
    <img width="200" src="https://github.com/tradingview/lightweight-charts/raw/master/.github/logo.svg?sanitize=true">
  </a>

  <h1>Lightweight Charts</h1>

  [![CircleCI][ci-img]][ci-link]
  [![npm version][npm-version-img]][npm-link]
  [![npm bundle size][bundle-size-img]][bundle-size-link]
  [![Dependencies count][deps-count-img]][bundle-size-link]
  [![Downloads][npm-downloads-img]][npm-link]
</div>

<!-- markdownlint-enable no-inline-html -->

[Demos][demo-url] | [Documentation](https://tradingview.github.io/lightweight-charts/) | [Discord community](https://discord.gg/UC7cGkvn4U)

TradingView Lightweight Charts are one of the smallest and fastest financial HTML5 charts.

The Lightweight Charting Library is the best choice for you if you want to display financial data as an interactive chart on your web page without affecting your web page loading speed and performance.

It is the best choice for you if you want to replace static image charts with interactive ones.
The size of the library is close to static images but if you have dozens of image charts on a web page then using this library can make the size of your web page smaller.

## Installing

### es6 via npm

```bash
npm install lightweight-charts
```

```js
import { createChart } from 'lightweight-charts';

const chart = createChart(document.body, { width: 400, height: 300 });
const lineSeries = chart.addLineSeries();
lineSeries.setData([
    { time: '2019-04-11', value: 80.01 },
    { time: '2019-04-12', value: 96.63 },
    { time: '2019-04-13', value: 76.64 },
    { time: '2019-04-14', value: 81.89 },
    { time: '2019-04-15', value: 74.43 },
    { time: '2019-04-16', value: 80.01 },
    { time: '2019-04-17', value: 96.63 },
    { time: '2019-04-18', value: 76.64 },
    { time: '2019-04-19', value: 81.89 },
    { time: '2019-04-20', value: 74.43 },
]);
```

### CDN

You can use [unpkg](https://unpkg.com/):

<https://unpkg.com/lightweight-charts/dist/lightweight-charts.standalone.production.js>

The standalone version creates `window.LightweightCharts` object with all exports from `esm` version:

```js
const chart = LightweightCharts.createChart(document.body, { width: 400, height: 300 });
const lineSeries = chart.addLineSeries();
lineSeries.setData([
    { time: '2019-04-11', value: 80.01 },
    { time: '2019-04-12', value: 96.63 },
    { time: '2019-04-13', value: 76.64 },
    { time: '2019-04-14', value: 81.89 },
    { time: '2019-04-15', value: 74.43 },
    { time: '2019-04-16', value: 80.01 },
    { time: '2019-04-17', value: 96.63 },
    { time: '2019-04-18', value: 76.64 },
    { time: '2019-04-19', value: 81.89 },
    { time: '2019-04-20', value: 74.43 },
]);
```

## Development

See [BUILDING.md](./BUILDING.md) for instructions on how to build `lightweight-charts` from source.

## License

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this software except in compliance with the License.
You may obtain a copy of the License at LICENSE file.
Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

This software incorporates several parts of tslib (<https://github.com/Microsoft/tslib>, (c) Microsoft Corporation) that are covered by BSD Zero Clause License.

This license requires specifying TradingView as the product creator.
You shall add the "attribution notice" from the NOTICE file and a link to <https://www.tradingview.com/> to the page of your website or mobile application that is available to your users.
As thanks for creating this product, we'd be grateful if you add it in a prominent place.

[demo-url]: https://www.tradingview.com/lightweight-charts/

[ci-img]: https://img.shields.io/circleci/build/github/tradingview/lightweight-charts.svg
[ci-link]: https://circleci.com/gh/tradingview/lightweight-charts

[npm-version-img]: https://badge.fury.io/js/lightweight-charts.svg
[npm-downloads-img]: https://img.shields.io/npm/dm/lightweight-charts.svg
[npm-link]: https://www.npmjs.com/package/lightweight-charts

[bundle-size-img]: https://badgen.net/bundlephobia/minzip/lightweight-charts
[deps-count-img]: https://img.shields.io/badge/dynamic/json.svg?label=dependecies&color=brightgreen&query=$.dependencyCount&uri=https%3A%2F%2Fbundlephobia.com%2Fapi%2Fsize%3Fpackage%3Dlightweight-charts
[bundle-size-link]: https://bundlephobia.com/result?p=lightweight-charts

---
---

# Line Tools

## Video

https://github.com/difurious/lightweight-charts-line-tools/assets/61764595/250ce779-9797-45fb-9f0b-2b9d51899376

---

## Line Tools Examples

![Arrow](https://github.com/difurious/lightweight-charts-line-tools/assets/61764595/a911417c-2c1b-4267-8d48-bf4f98992c7b) ![Brush](https://github.com/difurious/lightweight-charts-line-tools/assets/61764595/6c90bf3d-0e4a-44d0-a7de-11885719f186)
![Callout](https://github.com/difurious/lightweight-charts-line-tools/assets/61764595/975c917d-472a-466f-89e0-6be507448a83) ![Circle](https://github.com/difurious/lightweight-charts-line-tools/assets/61764595/eebe6b23-67d7-4213-abfc-ae285fb0014d)
![CrossLine](https://github.com/difurious/lightweight-charts-line-tools/assets/61764595/9d5f7e89-6297-42c5-89f3-f22eea91fcb8) ![ExtendedLine](https://github.com/difurious/lightweight-charts-line-tools/assets/61764595/01eb1e2b-a3eb-423a-bfe0-b39b08d497e2)
![FibRetracement](https://github.com/difurious/lightweight-charts-line-tools/assets/61764595/8a6aeeed-9921-42d7-ba2f-dcaf13757687) ![Highlighter](https://github.com/difurious/lightweight-charts-line-tools/assets/61764595/a8b37235-b1f0-4a4c-aee1-a45bb82ec2d1)
![HorizontalLine](https://github.com/difurious/lightweight-charts-line-tools/assets/61764595/b448536b-d25b-4f19-a402-3b104b26358c) ![HorizontalRay](https://github.com/difurious/lightweight-charts-line-tools/assets/61764595/88b784e5-071f-4409-9587-3183d6cbc0e1)
![ParallelChannel](https://github.com/difurious/lightweight-charts-line-tools/assets/61764595/1f8cdd55-f5a1-43e2-af14-c12211631a6f) ![Path](https://github.com/difurious/lightweight-charts-line-tools/assets/61764595/c6f42a75-9c31-4ad5-90e3-657e9e791d8e)
![PriceRange](https://github.com/difurious/lightweight-charts-line-tools/assets/61764595/a50ba3ed-e3dc-44e1-86e4-cf4e4e960b63) ![Ray](https://github.com/difurious/lightweight-charts-line-tools/assets/61764595/93a51e9b-f8fe-4c70-a5fa-dc741b954968)
![Rectangle](https://github.com/difurious/lightweight-charts-line-tools/assets/61764595/e58a827b-1839-4bb0-b6b4-0ac2524bee52) ![Text](https://github.com/difurious/lightweight-charts-line-tools/assets/61764595/320e4f31-ad24-4d9c-b6de-eef3ddbafafa)
![TrendLine](https://github.com/difurious/lightweight-charts-line-tools/assets/61764595/deae3f8c-17f6-4af7-a8f6-fdae9e626285) ![Triangle](https://github.com/difurious/lightweight-charts-line-tools/assets/61764595/d6b97024-0230-4d0b-b47d-6cc132e2b311)
![VerticalLine](https://github.com/difurious/lightweight-charts-line-tools/assets/61764595/4f7f2418-06f5-49bd-926d-3a0c8f1e758a)

---

## About
Line Tools is build off of [lightweight-charts 3.8.0](https://github.com/tradingview/lightweight-charts/tree/v3.8.0).  It adds multiple interactive drawing tools.

---

## Acknowledgments

<br>Sync crosshairs, and draggable was from [randalhsu](https://github.com/randalhsu/OPAL/tree/main/lightweight-charts-patch)
<br>Initial rough code of line tools was from [iosiftalmacel](https://github.com/iosiftalmacel/)
<br>Merge of iosiftalmacel's line tools to lightweight-charts 3.8.0 was done by Discord user **shinobaki**
<br>Other line tools additions done by Discord user **difurious**

---

## Tasklist
- [ ] Optimize the code that currently exists
- [ ] Fix npm install so you dont need to use --force
- [ ] When you commit, it complains about tsconfig.json, need to figure out why, "commit --no-verify" works for now
- [ ] Update Line Tools to use lightweight-charts 4.x.x
- [ ] Convert to plugin when that exists on lightweight-charts 4.x.x
- [ ] Add new line tools
- [X] Add new line tool - Circle
- [X] Add new line tool - Callout
- [X] Add new line tool - Price Range
- [ ] Add line tools related functionality to aid in trading

---
## Known Bugs
- If trying to use some tools in a blank area to the left of the first data point, it might not show
- Some line tools options do nothing "angle, scale, cap, join"
- The Circle tool, if the 2nd point is to the left of the 1st point, and you pan the screen to the right so the 1st point goes off the screen, then the circle will disappear. Just put the 2nd point to the right of the 1st point to prevent.

---

## <a name="how-to-build"></a>How to Build
1. Clone the project
2. have node installed, you can google it
3. cd into the clones project directory
4. `npm install --force`
5. `npm run build:prod`
6. now you can view the debug.html in the root folder to view how the lineTools works
7. built files are located in /dist 

---

## Main Features
1. **[Crosshair Sync](#crosshair-sync)**
2. **[createPriceLine added ability to make a horizontal ray](#create-price-line-ray)**  (draggable createPriceLine was removed from code, see [commit](https://github.com/difurious/lightweight-charts-line-tools/commit/140da15ba31057bb4bc7a6e22ccfd68320698e19) it you want to add it back)
3. **[Line Tools](#how-to-use-line-tools)**
  
    FibRetracement, ParallelChannel, HorizontalLine, VerticalLine, Highlighter, CrossLine, TrendLine, Rectangle, Triangle, Brush,	Path, Text,	Ray, Arrow,	ExtendedLine,	HorizontalRay, Circle, Callout, PriceRange

---

## <a name="crosshair-sync"></a>Crosshair Sync
params data from the subscribe will look like 
```js
{
    "time": 1686576600,
    "point": {
        "x": 1621.5,
        "y": 538.484375
    }
}
```

What I use in react

```jsx
useEffect(() => {

  if(chartReady === true){
    console.log("inside useEffect for crosshair SyncHandler")

    //used to store the previous xx time if the timeToCoord return null, then the crosshair would disapear
    //so ill use this var to just display the previous candle vs it disapearring constantly
    //TODO, this will only update when a new time interval from chart 1 is hit, so it techncicly
    //shows the incorrect  time if time is between the 2 chart intervals
    var crosshairPreviousXX = 0

    //const crosshairSyncHandler = (param, seriesMaster, seriesSlave, fromChartNumber, chartToModify) => {
    const crosshairSyncHandler = (param, fromChartNumber) => {
      console.log("syncing crosshairs master is chart " + fromChartNumber)
      console.log(param)

      if(fromChartNumber === 1){
        var chartToModify = chart2
        var seriesMaster = candleSeriesRef
        var seriesSlave = candleSeries2Ref
      }

      else if(fromChartNumber === 2) {
        
        var chartToModify = chart
        var seriesMaster = candleSeries2Ref
        var seriesSlave = candleSeriesRef
        
      }        

      if(param.time !== undefined) {

        //time axis
        var xx = chartToModify.current.timeScale().timeToCoordinate(param.time);
        var price = seriesMaster.current.coordinateToPrice(param.point.y)
        //price axis
        var yy = seriesSlave.current.priceToCoordinate(price);
        //console.log("x cord = " + xx)
        //console.log("y cord = " + yy)
        //everything is good, so update the crosshair
        if(xx !== null){
          //console.log("both axis")
          //console.log("x = " + xx)
          //console.log("y = " + yy)
          chartToModify.current.setCrossHairXY(xx,yy,true);
          //set previous because xx is a lefit time
          crosshairPreviousXX = xx
        }
        else{
          //console.log("else")
          //console.log("x = " + xx)
          //console.log("y = " + yy)
          //if xx is null than it did not respond with a time, so use crosshairPreviousXX so it displays something
          chartToModify.current.setCrossHairXY(crosshairPreviousXX,yy,true);
        }
      }
      
      //time is undefined
      else{
        //point.y exists
        if(param.point !== undefined){
          //console.log("param.point.y = " + param.point.y )
          var price = seriesMaster.current.coordinateToPrice(param.point.y)
          //price axis
          var yy = seriesSlave.current.priceToCoordinate(price); 
          //only show the price axis
          //console.log("x = " + xx)
          //console.log("y = " + yy)
          chartToModify.current.setCrossHairXY(null,yy,true); 
        }

        //no axis points exist, most likely cursor is in Y price scale axis
        //point.y does not exist
        else{
          //clar the slave chart crosshair
          chartToModify.current.clearCrossHair();
        }
      
      }
    }
    
    
    const chart1CrosshairSyncHandler = (param) => {
      crosshairSyncHandler(param, 1)
    }
    
    const chart2CrosshairSyncHandler = (param) => {
      crosshairSyncHandler(param, 2)
    }         

  
    //chart 2 exists and sync crosshairs is enabled
    if(chartReady === true && chart2Ready === true && syncCrosshairsDisabled === false && syncCrosshairsSelected === true){
      console.log("inside sync crosshairs")
  
      //chart 1 active
      if(pointerOverChart === 1){
        if(chart2.current !== null && chart2ContainerRef.current !== null){
          chart2.current.unsubscribeCrosshairMove(chart2CrosshairSyncHandler)
        }
        
        chart.current.subscribeCrosshairMove(chart1CrosshairSyncHandler)
      }

      //chart 2 active
      else if(pointerOverChart === 2){
        chart.current.unsubscribeCrosshairMove(chart1CrosshairSyncHandler)
        if(chart2.current !== null && chart2ContainerRef.current !== null){
          chart2.current.subscribeCrosshairMove(chart2CrosshairSyncHandler)
        }   
      }      

      return () => {
        chart.current.unsubscribeCrosshairMove(chart1CrosshairSyncHandler)
        if(chart2.current !== null && chart2ContainerRef.current !== null){
          chart2.current.unsubscribeCrosshairMove(chart2CrosshairSyncHandler)
        }
        
      }
    }

    //crosshair sync is not active, so unsubscribe to both events
    else{
      chart.current.unsubscribeCrosshairMove(chart1CrosshairSyncHandler)

      if(chart2Ready === true && chart2.current !== null && chart2ContainerRef.current !== null){
        chart2.current.unsubscribeCrosshairMove(chart2CrosshairSyncHandler)
      }
      
    }
  }

}, [chartReady, chart2Ready, syncCrosshairsDisabled, syncCrosshairsSelected, pointerOverChart])
```

---

## <a name="create-price-line-ray"></a>createPriceLine Ray

Make a ray using the built in createPriceLine code. This requires the timestamp number to be provided.

```js
var manualLineToCreate =
  {
    price: #whateverPriceYouWant,
    color: "yellow",
    lineWidth: 1,
    lineVisible: true,
    lineStyle: LineStyle.Solid,
    axisLabelVisible: true,
    title: "#AddYourTitle",
    draggable: true, //draggale is not in this build, wont hurt anything to leave this in
    ray: true, //true to make the line a ray, needs rayStart if true.  If false then it will be a full horizontal line
    rayStart: #theTimeStampToHaveTheRayStart,  //required if ray: true, this is the timeStamp for the ray to start
  }

//add the line
manualLineToCreateFinal = candleSeriesRef.current.createPriceLine(manualLineToCreate)
```
---

## <a name="how-to-use-line-tools"></a>How To Use LineTools
1. read how to build the code [here](#how-to-build)
2. open the file "debug.html" in the root folder with browser or edit to view code for an example of each Line Tool

---

### Create a Line Tool

This will create a Horizontal LineTool.  
> `chart.current.addLineTool("HorizontalLine",[],{})`

The empty array is the point(s), points can look like this
> `[{price: #PRICE, timestamp: #TIMESTAMP}]`

 and the empty object at the end uses the default options.  It will create the line tool and wait for user input for a click to place it.  See "debug.html" to see all the options that are availible for each specific tool. Line Tool Options that exist but dont do anything are
 * angle, scale, cap, join

---
### Hold Shift on Some Line Tools

If you hold shift when editing a line tool will create a straight horizontal line while editing.  Shift works on only these specific line tools
* ParallelChannel, TrendLine, Arrow, ExtendedLine, Ray, Rectangle, FibRetracement

---

### Line Tool Functionality
<br>
exportLineTools() will export all existing line tools, it will be a JSON string

> ```var allExistingLineTools = chart.current.exportLineTools()```

<br>
import line tools JSON string and it will be added to the chart, it compounds on top of any existing line tools, even if id's have duplictes. You could "chart.current.removeAllLineTools()" to deleted everyting first before the import

> ```chart.current.importLineTools(chart.current.exportLineTools())```

<br>
deletes all line tools on the specific chart

> ```chart.current.removeAllLineTools()```

<br>
If you select a line tool on screen, then run this command, the selected line tool(s) will be deleted

> ```chart.current.removeSelectedLineTools()```

<br>
create a line tool object and apply it to an existing line by having the "id" match

```js
  var applyLineToolOptionsOBJ = {
      id: String(#idOfLineToolToModify),
      toolType: String(#lineToolName),
      options: {#optionsToChange},
      points: [#pointsObject1,#pointsObject2],
  }
  chart.current.applyLineToolOptions(applyLineToolOptionsOBJ)
```
<br>

Get the currently selected line tool, and return that line tools data in the format that exportLineTools() uses
> ```var theSelectedLineTool = chart.current.getSelectedLineTools()```

<br>

Delete any line tools that match these specific ID's.  It needs to be an array of string ID's

```chart.current.removeLineToolsById(["id1","id2","id3","id4"])```

<br>

Sorry, I dont know how to use this one, I have not needed to use this 

```chart.current.setActiveLineTool("#IdontKNowWhatToPassToThis")```

<br>

When a line tool is double clicked, params will be the specific line tool's export data.

```js 
function lineToolWasDoubleClicked(params){
    console.log(params)
}

chart.current.subscribeLineToolsDoubleClick(lineToolWasDoubleClicked);

return () => {
    chart.current.unsubscribeLineToolsDoubleClick(lineToolWasDoubleClicked);
}
```

<br>

Subscribe to when a line tool is edited, or on creation.  Take note of the stage to tell if it was just created or if it was edited after it has already been created.

```js
function lineToolFinishedEditingChart(params){
  console.log("LineToolFinishedEditing EVENT")
  console.log(params)
  
  //params will be
  //{
    //selectedLineTool: #exportedLineToolData,
    //stage: string("#stageTheLineTool") 
  //}
  //stage can be
  //  "lineToolEdited" this is after a line tool has ben edited after it has already been created
  //  "pathFinished" this is when the path line tool finished being created
  //  "lineToolFinished" this is when any line tool besides path just finished being created.
}
if(chartReady === true){
  chart.current.subscribeLineToolsAfterEdit(lineToolFinishedEditingChart);


  return () => {
    chart.current.unsubscribeLineToolsAfterEdit(lineToolFinishedEditingChart);
  }  
}
```




























