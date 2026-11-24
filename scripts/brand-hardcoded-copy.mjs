// Audited display-only brand literals that are outside react-intl messages.
// Protocols, auth data, service headers, mention serialization and search enums
// retain their original bytes. No event handler or component geometry changes.
const patch = (name, file, from, to, expectedCount = 1) => ({name, file, from, to, expectedCount});

// These three leaf SVGs contain drawn English wordmarks, not Intl text. Keep
// their root dimensions and caller props; replace only their visible text.
export const hardcodedBrandCopyPlan = [
  patch("sidebar-visible-O7c", 'app-initial-f3e281fb9a71.js',
    "O7c=e=>(0,D7c.jsx)(`svg`,{width:77.129955,height:18,viewBox:`0 0 77.129955 18`,fill:`none`,role:`img`,focusable:`false`,xmlns:`http://www.w3.org/2000/svg`,...e,children:(0,D7c.jsx)(`path`,{d:`M6.82200 15.16200Q5.00400 15.16200 3.64500 14.33400Q2.28600 13.50600 1.55700 12.03900Q0.82800 10.57200 0.82800 8.70000Q0.82800 6.82800 1.56600 5.36100Q2.30400 3.89400 3.66300 3.05700Q5.02200 2.22000 6.82200 2.22000Q8.31600 2.22000 9.49500 2.77800Q10.67400 3.33600 11.38500 4.33500Q12.09600 5.33400 12.24000 6.64800L10.04400 6.64800Q9.82800 5.49600 8.99100 4.83000Q8.15400 4.16400 6.91200 4.16400L6.75000 4.16400Q5.63400 4.16400 4.78800 4.74000Q3.94200 5.31600 3.48300 6.35100Q3.02400 7.38600 3.02400 8.70000Q3.02400 10.01400 3.48300 11.04000Q3.94200 12.06600 4.78800 12.64200Q5.63400 13.21800 6.75000 13.21800L6.91200 13.21800Q8.15400 13.21800 8.99100 12.55200Q9.82800 11.88600 10.04400 10.73400L12.24000 10.73400Q12.09600 12.03000 11.38500 13.02900Q10.67400 14.02800 9.49500 14.59500Q8.31600 15.16200 6.82200 15.16200ZM14.25600 2.40000L16.32600 2.40000L16.32600 7.15200Q16.72200 6.54000 17.42400 6.17100Q18.12600 5.80200 19.06200 5.80200Q20.53800 5.80200 21.41100 6.72900Q22.28400 7.65600 22.28400 9.22200L22.28400 15.00000L20.21400 15.00000L20.21400 9.61800Q20.21400 8.64600 19.79100 8.11500Q19.36800 7.58400 18.52200 7.58400L18.46800 7.58400Q17.53200 7.58400 16.92900 8.29500Q16.32600 9.00600 16.32600 10.14000L16.32600 15.00000L14.25600 15.00000ZM27.32398 15.18000Q25.91998 15.18000 25.06498 14.42400Q24.20998 13.66800 24.20998 12.46200Q24.20998 9.94200 27.79198 9.63600L30.20398 9.43800L30.20398 9.16800Q30.20398 8.39400 29.68198 7.94400Q29.15998 7.49400 28.31398 7.49400L28.25998 7.49400Q27.53998 7.49400 27.04498 7.81800Q26.54998 8.14200 26.42398 8.68200L24.40798 8.68200Q24.51598 7.87200 25.02898 7.21500Q25.54198 6.55800 26.38798 6.18000Q27.23398 5.80200 28.31398 5.80200Q30.18598 5.80200 31.19398 6.76500Q32.20198 7.72800 32.20198 9.31200L32.20198 13.00200Q32.20198 14.26200 32.30998 15.00000L30.40198 15.00000Q30.29398 14.46000 30.29398 13.77600Q29.86198 14.37000 29.07898 14.77500Q28.29598 15.18000 27.32398 15.18000ZM27.79198 13.50600Q28.40398 13.50600 28.96198 13.24500Q29.51998 12.98400 29.86198 12.47100Q30.20398 11.95800 30.20398 11.23800L30.20398 10.95000L27.98998 11.11200Q26.18998 11.27400 26.18998 12.37200Q26.18998 12.87600 26.60398 13.19100Q27.01798 13.50600 27.71998 13.50600L27.79198 13.50600ZM37.99797 15.00000Q36.79197 15.00000 36.16197 14.36100Q35.53197 13.72200 35.53197 12.53400L35.53197 7.69200L33.60597 7.69200L33.60597 6.00000L35.53197 6.00000L35.53197 3.08400L37.58397 3.08400L37.58397 6.00000L39.68997 6.00000L39.68997 7.69200L37.58397 7.69200L37.58397 12.21000Q37.58397 12.78600 37.80897 13.01100Q38.03397 13.23600 38.60997 13.23600L39.94197 13.23600L39.94197 15.00000L37.99797 15.00000ZM47.01597 15.16200Q45.23397 15.16200 43.92897 14.34300Q42.62397 13.52400 41.93097 12.05700Q41.23797 10.59000 41.23797 8.71800Q41.23797 6.84600 41.99397 5.37000Q42.74997 3.89400 44.12697 3.05700Q45.50397 2.22000 47.26797 2.22000Q48.76197 2.22000 49.93197 2.76000Q51.10197 3.30000 51.82197 4.25400Q52.54197 5.20800 52.70397 6.45000L50.48997 6.45000Q50.23797 5.35200 49.40097 4.74900Q48.56397 4.14600 47.35797 4.14600L47.19597 4.14600Q46.11597 4.14600 45.25197 4.70400Q44.38797 5.26200 43.90197 6.29700Q43.41597 7.33200 43.41597 8.71800Q43.41597 10.10400 43.90197 11.13000Q44.38797 12.15600 45.26097 12.70500Q46.13397 13.25400 47.24997 13.25400L47.39397 13.25400Q48.31197 13.25400 49.06797 12.85800Q49.82397 12.46200 50.28297 11.76900Q50.74197 11.07600 50.81397 10.19400L47.46597 10.19400L47.46597 8.37600L51.28197 8.37600Q52.03797 8.37600 52.42497 8.77200Q52.81197 9.16800 52.81197 9.90600L52.81197 15.00000L50.93997 15.00000L50.93997 13.29000Q50.43597 14.08200 49.38297 14.62200Q48.32997 15.16200 47.01597 15.16200ZM55.47597 2.40000L61.00197 2.40000Q62.81997 2.40000 63.92697 3.43500Q65.03397 4.47000 65.03397 6.30600Q65.03397 8.14200 63.92697 9.17700Q62.81997 10.21200 61.00197 10.21200L57.63597 10.21200L57.63597 15.00000L55.47597 15.00000ZM60.73197 8.28600Q61.75797 8.28600 62.31597 7.76400Q62.87397 7.24200 62.87397 6.30600Q62.87397 5.37000 62.31597 4.84800Q61.75797 4.32600 60.73197 4.32600L57.63597 4.32600L57.63597 8.28600L60.73197 8.28600ZM70.23595 4.32600L65.82595 4.32600L65.82595 2.40000L76.82395 2.40000L76.82395 4.32600L72.39595 4.32600L72.39595 15.00000L70.23595 15.00000Z`,fill:`currentColor`})})",
    "O7c=e=>(0,D7c.jsx)(`svg`,{width:77.129955,height:18,viewBox:`0 0 77.129955 18`,fill:`none`,role:`img`,focusable:`false`,xmlns:`http://www.w3.org/2000/svg`,...e,\"aria-label\":`视频助手`,\"data-yao-mode-wordmark\":`视频助手`,children:(0,D7c.jsx)(`text`,{x:0,y:9,dominantBaseline:`central`,fill:`currentColor`,fontFamily:`PingFang SC, Microsoft YaHei, sans-serif`,fontSize:16,fontWeight:600,children:`视频助手`})})"),
  patch("sidebar-visible-j7c", 'app-initial-f3e281fb9a71.js',
    "j7c=e=>(0,A7c.jsx)(`svg`,{width:123.983911,height:18,viewBox:`0 0 123.983911 18`,fill:`none`,role:`img`,focusable:`false`,xmlns:`http://www.w3.org/2000/svg`,...e,children:(0,A7c.jsx)(`path`,{d:`M6.82200 15.16200Q5.00400 15.16200 3.64500 14.33400Q2.28600 13.50600 1.55700 12.03900Q0.82800 10.57200 0.82800 8.70000Q0.82800 6.82800 1.56600 5.36100Q2.30400 3.89400 3.66300 3.05700Q5.02200 2.22000 6.82200 2.22000Q8.31600 2.22000 9.49500 2.77800Q10.67400 3.33600 11.38500 4.33500Q12.09600 5.33400 12.24000 6.64800L10.04400 6.64800Q9.82800 5.49600 8.99100 4.83000Q8.15400 4.16400 6.91200 4.16400L6.75000 4.16400Q5.63400 4.16400 4.78800 4.74000Q3.94200 5.31600 3.48300 6.35100Q3.02400 7.38600 3.02400 8.70000Q3.02400 10.01400 3.48300 11.04000Q3.94200 12.06600 4.78800 12.64200Q5.63400 13.21800 6.75000 13.21800L6.91200 13.21800Q8.15400 13.21800 8.99100 12.55200Q9.82800 11.88600 10.04400 10.73400L12.24000 10.73400Q12.09600 12.03000 11.38500 13.02900Q10.67400 14.02800 9.49500 14.59500Q8.31600 15.16200 6.82200 15.16200ZM14.25600 2.40000L16.32600 2.40000L16.32600 7.15200Q16.72200 6.54000 17.42400 6.17100Q18.12600 5.80200 19.06200 5.80200Q20.53800 5.80200 21.41100 6.72900Q22.28400 7.65600 22.28400 9.22200L22.28400 15.00000L20.21400 15.00000L20.21400 9.61800Q20.21400 8.64600 19.79100 8.11500Q19.36800 7.58400 18.52200 7.58400L18.46800 7.58400Q17.53200 7.58400 16.92900 8.29500Q16.32600 9.00600 16.32600 10.14000L16.32600 15.00000L14.25600 15.00000ZM27.32398 15.18000Q25.91998 15.18000 25.06498 14.42400Q24.20998 13.66800 24.20998 12.46200Q24.20998 9.94200 27.79198 9.63600L30.20398 9.43800L30.20398 9.16800Q30.20398 8.39400 29.68198 7.94400Q29.15998 7.49400 28.31398 7.49400L28.25998 7.49400Q27.53998 7.49400 27.04498 7.81800Q26.54998 8.14200 26.42398 8.68200L24.40798 8.68200Q24.51598 7.87200 25.02898 7.21500Q25.54198 6.55800 26.38798 6.18000Q27.23398 5.80200 28.31398 5.80200Q30.18598 5.80200 31.19398 6.76500Q32.20198 7.72800 32.20198 9.31200L32.20198 13.00200Q32.20198 14.26200 32.30998 15.00000L30.40198 15.00000Q30.29398 14.46000 30.29398 13.77600Q29.86198 14.37000 29.07898 14.77500Q28.29598 15.18000 27.32398 15.18000ZM27.79198 13.50600Q28.40398 13.50600 28.96198 13.24500Q29.51998 12.98400 29.86198 12.47100Q30.20398 11.95800 30.20398 11.23800L30.20398 10.95000L27.98998 11.11200Q26.18998 11.27400 26.18998 12.37200Q26.18998 12.87600 26.60398 13.19100Q27.01798 13.50600 27.71998 13.50600L27.79198 13.50600ZM37.99797 15.00000Q36.79197 15.00000 36.16197 14.36100Q35.53197 13.72200 35.53197 12.53400L35.53197 7.69200L33.60597 7.69200L33.60597 6.00000L35.53197 6.00000L35.53197 3.08400L37.58397 3.08400L37.58397 6.00000L39.68997 6.00000L39.68997 7.69200L37.58397 7.69200L37.58397 12.21000Q37.58397 12.78600 37.80897 13.01100Q38.03397 13.23600 38.60997 13.23600L39.94197 13.23600L39.94197 15.00000L37.99797 15.00000ZM47.01597 15.16200Q45.23397 15.16200 43.92897 14.34300Q42.62397 13.52400 41.93097 12.05700Q41.23797 10.59000 41.23797 8.71800Q41.23797 6.84600 41.99397 5.37000Q42.74997 3.89400 44.12697 3.05700Q45.50397 2.22000 47.26797 2.22000Q48.76197 2.22000 49.93197 2.76000Q51.10197 3.30000 51.82197 4.25400Q52.54197 5.20800 52.70397 6.45000L50.48997 6.45000Q50.23797 5.35200 49.40097 4.74900Q48.56397 4.14600 47.35797 4.14600L47.19597 4.14600Q46.11597 4.14600 45.25197 4.70400Q44.38797 5.26200 43.90197 6.29700Q43.41597 7.33200 43.41597 8.71800Q43.41597 10.10400 43.90197 11.13000Q44.38797 12.15600 45.26097 12.70500Q46.13397 13.25400 47.24997 13.25400L47.39397 13.25400Q48.31197 13.25400 49.06797 12.85800Q49.82397 12.46200 50.28297 11.76900Q50.74197 11.07600 50.81397 10.19400L47.46597 10.19400L47.46597 8.37600L51.28197 8.37600Q52.03797 8.37600 52.42497 8.77200Q52.81197 9.16800 52.81197 9.90600L52.81197 15.00000L50.93997 15.00000L50.93997 13.29000Q50.43597 14.08200 49.38297 14.62200Q48.32997 15.16200 47.01597 15.16200ZM55.47597 2.40000L61.00197 2.40000Q62.81997 2.40000 63.92697 3.43500Q65.03397 4.47000 65.03397 6.30600Q65.03397 8.14200 63.92697 9.17700Q62.81997 10.21200 61.00197 10.21200L57.63597 10.21200L57.63597 15.00000L55.47597 15.00000ZM60.73197 8.28600Q61.75797 8.28600 62.31597 7.76400Q62.87397 7.24200 62.87397 6.30600Q62.87397 5.37000 62.31597 4.84800Q61.75797 4.32600 60.73197 4.32600L57.63597 4.32600L57.63597 8.28600L60.73197 8.28600ZM70.23595 4.32600L65.82595 4.32600L65.82595 2.40000L76.82395 2.40000L76.82395 4.32600L72.39595 4.32600L72.39595 15.00000L70.23595 15.00000ZM80.89193 2.40000L83.10593 2.40000L85.48193 12.69600L87.67793 2.40000L90.39593 2.40000L92.59193 12.73200L94.85993 2.40000L97.09193 2.40000L93.99593 15.00000L91.15193 15.00000L88.99193 5.26200L86.83193 15.00000L83.96993 15.00000ZM102.07792 15.19800Q100.79992 15.19800 99.76492 14.58600Q98.72992 13.97400 98.14492 12.89400Q97.55992 11.81400 97.55992 10.48200Q97.55992 9.16800 98.14492 8.09700Q98.72992 7.02600 99.76492 6.41400Q100.79992 5.80200 102.07792 5.80200Q103.35592 5.80200 104.38192 6.41400Q105.40792 7.02600 105.99292 8.08800Q106.57792 9.15000 106.57792 10.48200Q106.57792 11.81400 105.99292 12.89400Q105.40792 13.97400 104.38192 14.58600Q103.35592 15.19800 102.07792 15.19800ZM102.11392 13.45200Q103.17592 13.45200 103.83292 12.64200Q104.48992 11.83200 104.48992 10.48200Q104.48992 9.15000 103.83292 8.34900Q103.17592 7.54800 102.11392 7.54800L102.00592 7.54800Q100.96192 7.54800 100.30492 8.35800Q99.64792 9.16800 99.64792 10.48200Q99.64792 11.81400 100.30492 12.63300Q100.96192 13.45200 102.00592 13.45200L102.11392 13.45200ZM108.57591 6.00000L110.60991 6.00000L110.60991 7.71000Q110.89791 6.90000 111.62691 6.39600Q112.35591 5.89200 113.34591 5.89200L113.81391 5.89200L113.81391 7.81800L113.20191 7.81800Q111.95991 7.81800 111.30291 8.58300Q110.64591 9.34800 110.64591 10.78800L110.64591 15.00000L108.57591 15.00000ZM115.52391 2.40000L117.59391 2.40000L117.59391 9.61800L121.17591 6.00000L123.76791 6.00000L120.22191 9.58200L123.94791 15.00000L121.48191 15.00000L118.76391 11.04000L117.59391 12.21000L117.59391 15.00000L115.52391 15.00000Z`,fill:`currentColor`})})",
    "j7c=e=>(0,A7c.jsx)(`svg`,{width:123.983911,height:18,viewBox:`0 0 123.983911 18`,fill:`none`,role:`img`,focusable:`false`,xmlns:`http://www.w3.org/2000/svg`,...e,\"aria-label\":`视频工作`,\"data-yao-mode-wordmark\":`视频工作`,children:(0,A7c.jsx)(`text`,{x:0,y:9,dominantBaseline:`central`,fill:`currentColor`,fontFamily:`PingFang SC, Microsoft YaHei, sans-serif`,fontSize:16,fontWeight:600,children:`视频工作`})})"),
  patch("sidebar-visible-P7c", 'app-initial-f3e281fb9a71.js',
    "P7c=e=>(0,N7c.jsx)(`svg`,{width:53.225983,height:18,viewBox:`0 0 53.225983 18`,fill:`none`,role:`img`,focusable:`false`,xmlns:`http://www.w3.org/2000/svg`,...e,children:(0,N7c.jsx)(`path`,{d:`M6.82200 15.16200Q5.00400 15.16200 3.64500 14.33400Q2.28600 13.50600 1.55700 12.03900Q0.82800 10.57200 0.82800 8.70000Q0.82800 6.82800 1.56600 5.36100Q2.30400 3.89400 3.66300 3.05700Q5.02200 2.22000 6.82200 2.22000Q8.31600 2.22000 9.49500 2.77800Q10.67400 3.33600 11.38500 4.33500Q12.09600 5.33400 12.24000 6.64800L10.04400 6.64800Q9.82800 5.49600 8.99100 4.83000Q8.15400 4.16400 6.91200 4.16400L6.75000 4.16400Q5.63400 4.16400 4.78800 4.74000Q3.94200 5.31600 3.48300 6.35100Q3.02400 7.38600 3.02400 8.70000Q3.02400 10.01400 3.48300 11.04000Q3.94200 12.06600 4.78800 12.64200Q5.63400 13.21800 6.75000 13.21800L6.91200 13.21800Q8.15400 13.21800 8.99100 12.55200Q9.82800 11.88600 10.04400 10.73400L12.24000 10.73400Q12.09600 12.03000 11.38500 13.02900Q10.67400 14.02800 9.49500 14.59500Q8.31600 15.16200 6.82200 15.16200ZM18.21600 15.19800Q16.93800 15.19800 15.90300 14.58600Q14.86800 13.97400 14.28300 12.89400Q13.69800 11.81400 13.69800 10.48200Q13.69800 9.16800 14.28300 8.09700Q14.86800 7.02600 15.90300 6.41400Q16.93800 5.80200 18.21600 5.80200Q19.49400 5.80200 20.52000 6.41400Q21.54600 7.02600 22.13100 8.08800Q22.71600 9.15000 22.71600 10.48200Q22.71600 11.81400 22.13100 12.89400Q21.54600 13.97400 20.52000 14.58600Q19.49400 15.19800 18.21600 15.19800ZM18.25200 13.45200Q19.31400 13.45200 19.97100 12.64200Q20.62800 11.83200 20.62800 10.48200Q20.62800 9.15000 19.97100 8.34900Q19.31400 7.54800 18.25200 7.54800L18.14400 7.54800Q17.10000 7.54800 16.44300 8.35800Q15.78600 9.16800 15.78600 10.48200Q15.78600 11.81400 16.44300 12.63300Q17.10000 13.45200 18.14400 13.45200L18.25200 13.45200ZM28.22399 15.18000Q27.07199 15.18000 26.14499 14.59500Q25.21799 14.01000 24.68699 12.94800Q24.15599 11.88600 24.15599 10.50000Q24.15599 9.11400 24.69599 8.04300Q25.23599 6.97200 26.18099 6.38700Q27.12599 5.80200 28.29599 5.80200Q29.21399 5.80200 29.94299 6.18000Q30.67199 6.55800 31.03199 7.11600L31.03199 2.40000L33.10199 2.40000L33.10199 15.00000L31.03199 15.00000L31.03199 13.81200Q30.68999 14.40600 29.93399 14.79300Q29.17799 15.18000 28.22399 15.18000ZM28.67399 13.45200Q29.71799 13.45200 30.38399 12.63300Q31.04999 11.81400 31.04999 10.48200Q31.04999 9.16800 30.38399 8.34900Q29.71799 7.53000 28.67399 7.53000L28.58399 7.53000Q27.53999 7.53000 26.89199 8.34900Q26.24399 9.16800 26.24399 10.48200Q26.24399 11.81400 26.89199 12.63300Q27.53999 13.45200 28.58399 13.45200L28.67399 13.45200ZM39.41999 15.19800Q38.21399 15.19800 37.23299 14.61300Q36.25199 14.02800 35.68499 12.96600Q35.11799 11.90400 35.11799 10.50000Q35.11799 9.11400 35.68499 8.04300Q36.25199 6.97200 37.22399 6.38700Q38.19599 5.80200 39.40199 5.80200Q41.07599 5.80200 42.20999 6.82800Q43.34399 7.85400 43.52399 9.63600Q43.57799 10.30200 43.55999 11.05800L37.15199 11.05800Q37.20599 12.15600 37.85399 12.82200Q38.50199 13.48800 39.40199 13.48800L39.50999 13.48800Q40.21199 13.48800 40.70699 13.13700Q41.20199 12.78600 41.36399 12.21000L43.43399 12.21000Q43.10999 13.54200 42.04799 14.37000Q40.98599 15.19800 39.41999 15.19800ZM41.48999 9.45600Q41.41799 8.55600 40.85999 8.03400Q40.30199 7.51200 39.45599 7.51200L39.34799 7.51200Q38.53799 7.51200 37.95299 8.00700Q37.36799 8.50200 37.20599 9.45600L41.48999 9.45600ZM47.41198 10.46400L44.20798 6.00000L46.54798 6.00000L48.58198 8.82600L50.65198 6.00000L52.91998 6.00000L49.71598 10.41000L53.00998 15.00000L50.66998 15.00000L48.54598 12.03000L46.38598 15.00000L44.11798 15.00000Z`,fill:`currentColor`})})",
    "P7c=e=>(0,N7c.jsx)(`svg`,{width:53.225983,height:18,viewBox:`0 0 53.225983 18`,fill:`none`,role:`img`,focusable:`false`,xmlns:`http://www.w3.org/2000/svg`,...e,\"aria-label\":`视频工作`,\"data-yao-mode-wordmark\":`视频工作`,children:(0,N7c.jsx)(`text`,{x:0,y:9,dominantBaseline:`central`,fill:`currentColor`,fontFamily:`PingFang SC, Microsoft YaHei, sans-serif`,fontSize:12.5,fontWeight:600,children:`视频工作`})})"),
  patch('windows-setup-display-name', 'app-primary-9bb8fd8d770a.js',
    'values:{appName:`ChatGPT`}', 'values:{appName:`姚同学`}', 3),
  patch('transcript-assistant-display-name', 'static-thread-transcript-a4e996285eec.js',
    'values:{appName:`ChatGPT`}', 'values:{appName:`姚同学`}'),
  patch('mac-menu-bar-display-name', 'general-settings-88784e2265b6.js',
    'cc,{appName:`ChatGPT`}', 'cc,{appName:`姚同学`}'),
  patch('assistant-header-fallback', 'register-DNfAakVi-4dadb8ead107.js',
    'let W=u?.name??`ChatGPT`', 'let W=u?.name??`姚同学`'),
  patch('comment-assignment-button', 'artifact-comments-header-1711bc4c6d4c.js',
    'F=s?.assignment??`Assign to ChatGPT`', 'F=s?.assignment??`交给姚同学`'),
  patch('comment-recipient-display', 'artifact-comments-header-1711bc4c6d4c.js',
    'recipient:s?.recipient??`@ChatGPT`', 'recipient:s?.recipient??`@姚同学`'),
  patch('comment-unread-label', 'artifact-comments-header-1711bc4c6d4c.js',
    '"aria-label":y?.unread??`New ChatGPT reply`', '"aria-label":y?.unread??`姚同学有新回复`'),
  patch('comment-assistant-display-name', 'artifact-comments-header-1711bc4c6d4c.js',
    'children:n?.assistantName??`ChatGPT`', 'children:n?.assistantName??`姚同学`'),
  patch('messaging-assistant-display-name', 'composer-controls-f7152b8b89d2.js',
    'G=M?`ChatGPT`:o.self?', 'G=M?`姚同学`:o.self?'),
  patch('approval-assistant-display-name', 'mcp-request-card-11250f4a3960.js',
    'h=f?.data?.aeon_kind===`orbit`?f.data.display_name:`ChatGPT`',
    'h=f?.data?.aeon_kind===`orbit`?f.data.display_name:`姚同学`'),
  patch('computer-control-display-name', 'cloud-browser-view-743ff8eb3c1e.js',
    'computerName:`ChatGPT`', 'computerName:`姚同学`'),
  patch('work-introduction-product-name', 'introduction-content-8cbb662cad64.js',
    'values:{productName:`ChatGPT Work`', 'values:{productName:`视频工作`'),
  patch('work-onboarding-product-name', 'home-b058da747294.js',
    'values:{productName:`ChatGPT Work`', 'values:{productName:`视频工作`'),
  patch('space-welcome-product-name', 'onboarding-e4554a849036.js',
    'values:{productName:`ChatGPT Space`', 'values:{productName:`腾讯视频创作空间`'),
  patch('artifact-edit-action', 'inspector-font-size-menu-48a47f066cdc.js',
    'label:r=`Ask ChatGPT`', 'label:r=`让姚同学修改`'),
  patch('project-document-title', 'page-945238e649e5.js',
    'let e=document.title,t=`ChatGPT - ${x}`', 'let e=document.title,t=`姚同学 - ${x}`'),
  patch('micro-onboarding-app-name', 'codex-micro-onboarding-host-54fd0f3b67da.js',
    'F=c?.appName??`ChatGPT`', 'F=c?.appName??`姚同学`'),
  patch('plan-display-name-fallback', 'dialog-a926f18334c1.js',
    't===`plus`?`Plus`:`ChatGPT`', 't===`plus`?`Plus`:`姚同学`'),
  patch('debug-conversation-display-heading', 'panel-6d9f656c32fb.js',
    'title:`ChatGPT Conversations`', 'title:`姚同学对话`'),
  patch('plugin-activity-display-name', 'sites-end-resource-b09415607262.js',
    'let i=r===`STEPS_PROSE`?`ChatGPT`:`Codex`', 'let i=r===`STEPS_PROSE`?`姚同学`:`姚同学`'),
  patch('plugin-result-display-name', 'sites-end-resource-b09415607262.js',
    'values:{appName:r===`STEPS_PROSE`?`ChatGPT`:`Codex`,pluginName:',
    'values:{appName:r===`STEPS_PROSE`?`姚同学`:`姚同学`,pluginName:'),
  patch('history-legacy-client-display-name', 'history-e9fb4db106d8.js',
    't===`ChatGPT Web Client`||t===`ChatGPT Web`?`ChatGPT`:t',
    't===`ChatGPT Web Client`||t===`ChatGPT Web`?`姚同学`:t'),
  // The canonical cKn/lP value is also an API/analytics brand enum. Keep that
  // value unchanged and adapt only its explicitly audited display parameters.
  patch('webview-shortcut-command-display-name', 'app-initial-f3e281fb9a71.js',
    'title:`New Chat in ChatGPT Sidebar`', 'title:`在姚同学侧边栏新建对话`'),
  patch('canonical-update-import-logout-display-name', 'app-initial-f3e281fb9a71.js',
    'values:{appName:lP}', 'values:{appName:`姚同学`}', 10),
  patch('canonical-import-progress-display-name', 'app-initial-f3e281fb9a71.js',
    '{appName:lP,progress:', '{appName:`姚同学`,progress:'),
  patch('canonical-import-empty-display-name', 'app-initial-f3e281fb9a71.js',
    '`},{appName:lP}),id:', '`},{appName:`姚同学`}),id:'),
  patch('shortcut-description-display-name', 'command-messages-ad31033db6e2.js',
    '{appName:s,dot:`dot`}', '{appName:`姚同学`,dot:`dot`}'),
  patch('configuration-restart-display-name', 'configuration-panel-c21655b636d6.js',
    'values:{appName:$e}', 'values:{appName:`姚同学`}'),
  patch('plugin-restart-display-name', 'plugins-settings-row-e9619d953ac8.js',
    'values:{appName:m}', 'values:{appName:`姚同学`}'),
  patch('settings-import-display-name', 'import-settings-82a89c405175.js',
    'values:{appName:it}', 'values:{appName:`姚同学`}', 3),
  patch('home-beacon-display-name', 'codex-app-home-beacon-announcement-f2a174c0993c.js',
    '{appName:Ie}', '{appName:`姚同学`}', 2),
  patch('general-settings-app-name', 'general-settings-88784e2265b6.js',
    'values:{appName:Kn}', 'values:{appName:`姚同学`}', 2),
  patch('general-settings-app-name-with-context', 'general-settings-88784e2265b6.js',
    'values:{appName:Kn,', 'values:{appName:`姚同学`,', 2),
  patch('general-settings-canonical-menu-bar-name', 'general-settings-88784e2265b6.js',
    'cc,{appName:Kn}', 'cc,{appName:`姚同学`}'),
  patch('site-result-canonical-display-name', 'sites-end-resource-b09415607262.js',
    'values:{appName:Lc}', 'values:{appName:`姚同学`}'),
  patch('demo-note-body-product-name', 'tasks-4aa0b66fb4ee.js',
    '{appName:on,paragraphBreak:', '{appName:`姚同学`,paragraphBreak:'),
  patch('demo-note-file-product-name', 'tasks-4aa0b66fb4ee.js',
    '{appName:on}', '{appName:`姚同学`}'),
  patch('project-import-progress-product-name', 'project-import-prompt-host-6a0f2dde40b6.js',
    '{appName:se,codexHome:', '{appName:`姚同学`,codexHome:'),
  patch('project-import-dialog-product-name', 'project-import-prompt-host-6a0f2dde40b6.js',
    'values:{appName:se}', 'values:{appName:`姚同学`}'),
  patch('space-tool-activity-display-name', 'mcp-tool-activity-label-6681024ebd03.js',
    'name:`ChatGPT Space`', 'name:`腾讯视频创作空间`', 2),
  patch('sharing-assistant-collaborator-display-name', 'sharing-e0fda158f4a8.js',
    'id:`presentation-creation-agent`,name:`ChatGPT`', 'id:`presentation-creation-agent`,name:`姚同学`'),
  patch("mention-chip-visible-assistant-name", "companion-tab-428823ba329e.js", "label:t?.(e)??(e.orbit==null?`ChatGPT`:`dot`)", "label:t?.(e)??(e.orbit==null?`姚同学`:`dot`)", 1),
  patch("alternate-assistant-header-fallback", "es-722d34b71812.js", "let F=c?.name??`ChatGPT`", "let F=c?.name??`姚同学`", 1),
  patch("debug-capability-display-label", "panel-6d9f656c32fb.js", "children:`ChatGPT feature access`", "children:`视频助手功能权限`", 1),
  patch("debug-api-display-label", "panel-6d9f656c32fb.js", "label:`ChatGPT API`", "label:`视频助手接口`", 1),
  patch("debug-humanized-brand-display-label", "panel-6d9f656c32fb.js", ".replace(/\\bchatgpt\\b/gi,`ChatGPT`)", ".replace(/\\bchatgpt\\b/gi,`姚同学`)", 1),
  patch("runtime.worker-23e049d76387.js-default-document-theme-name", "runtime.worker-23e049d76387.js", "name:`ChatGPT`", "name:`姚同学`", 5),
  patch("runtime.worker-23e049d76387.js-document-theme-name-fallback", "runtime.worker-23e049d76387.js", "??`ChatGPT`", "??`姚同学`", 3),
  patch("runtime.worker-aa68b08042af.js-default-document-theme-name", "runtime.worker-aa68b08042af.js", "name:`ChatGPT`", "name:`姚同学`", 5),
  patch("runtime.worker-aa68b08042af.js-document-theme-name-fallback", "runtime.worker-aa68b08042af.js", "??`ChatGPT`", "??`姚同学`", 3),
  patch("runtime.worker-57006b1ba70d.js-default-document-theme-name", "runtime.worker-57006b1ba70d.js", "name:`ChatGPT`", "name:`姚同学`", 5),
  patch("runtime.worker-57006b1ba70d.js-document-theme-name-fallback", "runtime.worker-57006b1ba70d.js", "??`ChatGPT`", "??`姚同学`", 3),
  patch("presentation-56c8dc7d3e86.js-default-document-theme-name", "presentation-56c8dc7d3e86.js", "name:`ChatGPT`", "name:`姚同学`", 5),
  patch("presentation-56c8dc7d3e86.js-document-theme-name-fallback", "presentation-56c8dc7d3e86.js", "??`ChatGPT`", "??`姚同学`", 3),
  patch("workbook-4f9563364a80.js-default-document-theme-name", "workbook-4f9563364a80.js", "name:`ChatGPT`", "name:`姚同学`", 5),
  patch("workbook-4f9563364a80.js-document-theme-name-fallback", "workbook-4f9563364a80.js", "??`ChatGPT`", "??`姚同学`", 3),
];

export const hardcodedBrandSourceFiles = [...new Set(hardcodedBrandCopyPlan.map(item => item.file))];

export function applyHardcodedBrandCopy(name, source) {
  let result = source;
  const changes = [];
  for (const item of hardcodedBrandCopyPlan.filter(item => item.file === name)) {
    const count = result.split(item.from).length - 1;
    if (count !== item.expectedCount) {
      throw new Error('Hardcoded brand display checkpoint changed: ' + item.name + ' (' + count + ')');
    }
    result = result.split(item.from).join(item.to);
    changes.push({name:item.name, file:name, count, kind:'display-only-brand-copy'});
  }
  return {source:result, changes};
}
