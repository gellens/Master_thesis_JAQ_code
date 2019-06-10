'use strict';
const path = require('path');
const fs = require('fs');
const credD = require('./credentials_dialogflow_JAQ.js');


const questions_set_file = "set_test.js";
// const questions_set_file = "set_test_typo_plurial.js";
// const questions_set_file = "set_test_typo_misspell.js";
// const questions_set_file = "set_test_no_questions_mark.js";
const INTER_REQUEST_MS = 1200;
const WRITE_LOG = true;
const WRITE_TIMES = true;


/////////////////////////////////////////
// initialisation of DialogFlow

const dialogflow = require('dialogflow');
process.env.GOOGLE_APPLICATION_CREDENTIALS = path.resolve(__dirname, credD.credentialFile);
const sessionClientD = new dialogflow.SessionsClient();

const languageCodeD = 'en-US';
const userContextD_test = sessionClientD.sessionPath(credD.projectId, "42");

const rnd = (x) => Number.parseFloat(x).toFixed(3);

//////////////////////////
// the stats class

class RawStats {
	// jsut print the intent detected for each question, the true intent and 
	updateAnalysisStat(question, intent, true_intent, confidenceLevel) {
		const result = `${question}: ${intent} @ ${confidenceLevel} >< ${true_intent} [${intent == true_intent}]`;
		console.log(result);
		logArray.push(result);
	}

	printAnalysis() { return }; // the result is directly printed to give a direct feedback on the screen during the test
}


class SimpleStats {
	// simple stats 
	constructor() {
		// variable containing the result of the analysis
		this.cnt_total =  0;
		this.cnt_scope = 0; // count the number of question in scope of the test set
		this.tl = 0; // true labeled
		this.tu = 0; // true unknown
		this.fl = 0; // false labeled
		this.fu = 0; // false unknown

		this.sum_tl_conf = 0; // sum of confidence level of true labeled
		this.sum_tu_conf = 0; // sum of confidence level of true unknown
		this.sum_fl_conf = 0; // sum of confidence level of false labeled
		this.sum_fu_conf = 0; // sum of confidence level of false unknown
	}


	updateAnalysisStat(question, intent, true_intent, confidenceLevel) {
		this.cnt_total += 1;
		
		if (true_intent != "Default Fallback Intent") {	this.cnt_scope += 1}

		if (intent == true_intent || (true_intent == "Default Fallback Intent" && !intent)) {
			if (intent) {
				this.tl += 1;
				this.sum_tl_conf += confidenceLevel;
			} else {
				this.tu += 1;
				this.sum_tu_conf += confidenceLevel;
			}
		} else if (!intent) {
			this.fu += 1;
			this.sum_fu_conf += confidenceLevel;
		} else {
			this.fl += 1;
			this.sum_fl_conf += confidenceLevel;
		}
	}


	printAnalysis() {
		let result = ["", "",
			`Test results: [${this.cnt_total} questions]`,
			`Accuracy:\t\t ${rnd((this.tl + this.tu) / this.cnt_total)} [${this.tl + this.tu}]`,
			`-> True labeled rate:\t ${rnd(this.tl / this.cnt_scope)} [${this.tl}]`,
			`-> True unknown rate:\t ${rnd(this.tu / (this.cnt_total - this.cnt_scope))} [${this.tu}]`,
			`Error rate:\t\t ${rnd((this.fl + this.fu) / this.cnt_total)} [${this.fl + this.fu}]`,
			`-> False labeled rate:\t ${rnd(this.fl / (this.fl+ this.tl))} [${this.fl}]`,
			`-> False unknown rate:\t ${rnd(this.fu / (this.fu + this.tu))} [${this.fu}]`,
			"",
			`Confidence level global:\t\t ${rnd((this.sum_tl_conf + this.sum_tu_conf + this.sum_fl_conf + this.sum_fu_conf) / this.cnt_total)}`,
			`Confidence level true:\t\t\t ${rnd((this.sum_tl_conf + this.sum_tu_conf) / (this.tl + this.tu))}`,
			`-> Confidence level true labeled:\t ${rnd(this.sum_tl_conf / this.tl)}`,
			`-> Confidence level true unknow:\t ${rnd(this.sum_tu_conf / this.tu)}`,
			`Confidence level false:\t\t\t ${rnd((this.sum_fl_conf + this.sum_fu_conf) / (this.fl + this.fu))}`,
			`-> Confidence level false labeled:\t ${rnd(this.sum_fl_conf / this.fl)}`,
			`-> Confidence level false unknow:\t ${rnd(this.sum_fu_conf / this.fu)}`,
		];
		console.log(result.join("\n"));
		logArray = logArray.concat(result);
	}
}


class PrecisionRecallStats {
	// source of the metric: A systematic analysis of performance measures for classification tasks
	// 		url: http://rali.iro.umontreal.ca/rali/sites/default/files/publis/SokolovaLapalme-JIPM09.pdf
	constructor() {
		this.cnt_total = 0;
		this.scores = {}; 			// by class
		this.generic_metric = {}; 	// global
	}


	initiate_if_necessary(intent) {
		if (!(intent in this.scores)) {
			this.scores[intent] = { tp: 0, fp: 0, fn: 0, tn: 0 } // note that the tn will be computed later as tn = cnt_total - tp - fp -fn
		} 
	}


	compute_tn() {
		for (let intent in this.scores) {
			let s = this.scores[intent];
			this.scores[intent].tn = this.cnt_total - s.tp - s.fn - s.fp
		}
	}


	compute_precision_recall_f1() {
		for (let intent in this.scores) {
			let s = this.scores[intent];
			s.p = s.tp / (s.tp + s.fp); 		// precision
			s.r = s.tp / (s.tp + s.fn); 		// recall
			s.f1 = 2 * s.p * s.r / (s.p + s.r); // f1 score
		}
	}


	print_per_intent_precision_recall_f1() {
		let result = ["", "", "Precision, recall and f1 score metric per intent:"];
		for (let intent in this.scores) {
			let s = this.scores[intent];
			result.push(`${intent} - precision: ${s.p}, recall: ${s.r}, f1 score: ${s.f1}`);
		}
		console.log(result.join("\n"));
		logArray = logArray.concat(result);
	}


	compute_generic_metric() {
		// require that the functions 'compute_tn' and 'compute_precision_recall_f1' have been runned before
		let sum_avg_acc = 0;
		let sum_err_rate = 0;

		let sum_tp = 0;
		let sum_fp = 0;
		let sum_fn = 0;

		let sum_p = 0;
		let nb_nan_p = 0;
		let sum_r = 0;
		let nb_nan_r = 0;


		for (let intent in this.scores) {
			let s = this.scores[intent];
			sum_avg_acc += (s.tp + s.tn) / this.cnt_total
			sum_err_rate += (s.fp + s.fn) / this.cnt_total;

			sum_tp += s.tp;
			sum_fp += s.fp;
			sum_fn += s.fn;

			if (isNaN(s.p)) { nb_nan_p += 1 } else { sum_p += s.p; }
			if (isNaN(s.r)) { nb_nan_r += 1 } else { sum_r += s.r; }
			
		}
		
		let gm = this.generic_metric;
		let nb_intent = Object.keys(this.scores).length;

		gm.avg_acc = sum_avg_acc / nb_intent; 									// average accuracy
		gm.err_rate = sum_err_rate / nb_intent; 								// error rate

		gm.p_micro = sum_tp / (sum_tp + sum_fp); 								// precision micro
		gm.r_micro = sum_tp / (sum_tp + sum_fn); 								// recall micro
		gm.f1_micro = 2 * gm.p_micro * gm.r_micro / (gm.p_micro + gm.r_micro); 	// f1 score micro

		gm.p_macro = sum_p / (nb_intent - nb_nan_p);							// precision macro
		gm.r_macro = sum_r / (nb_intent - nb_nan_r);							// recall macro
		gm.f1_macro = 2 * gm.p_macro * gm.r_macro / (gm.p_macro + gm.r_macro); 	// f1 score macro

	}


	print_generic_metric() {
		let gm = this.generic_metric;
		let result = ["", "",
			"Generic metrics:",
			`Average accuracy:\t ${rnd(gm.avg_acc)}`,
			`Error Rate:\t\t ${rnd(gm.err_rate)}`, "",
			`Precision µ:\t\t ${rnd(gm.p_micro)}`,
			`Recall µ:\t\t ${rnd(gm.r_micro)}`,
			`F1 score µ:\t\t ${rnd(gm.f1_micro)}`, "",
			`Precision M:\t\t ${rnd(gm.p_macro)}`,
			`Recall M:\t\t ${rnd(gm.r_macro)}`,
			`F1 score M:\t\t ${rnd(gm.f1_macro)}`,
		];
		console.log(result.join("\n"));
		logArray = logArray.concat(result);
	}


	updateAnalysisStat(question, intent, true_intent, confidenceLevel) {
		this.initiate_if_necessary(intent);
		this.initiate_if_necessary(true_intent);
		
		this.cnt_total += 1;
		if (intent == true_intent) {
			this.scores[intent].tp += 1;
		} else {
			this.scores[true_intent].fn += 1; 
			this.scores[intent].fp += 1; 
		}
	}


	printAnalysis() {
		this.compute_tn();
		this.compute_precision_recall_f1();
		this.print_per_intent_precision_recall_f1();

		this.compute_generic_metric();
		this.print_generic_metric();
	}
}


class TimeStats {	
	mean(arr) {
		const sum = arr.reduce((a, b) => { return a + b; });
		return sum / arr.length;
	}
	
	std_dev(arr, mean) { // Standard deviation
		const sum = arr.reduce((a, b) => { return a + (b - mean)**2;})
		return Math.sqrt(sum / (arr.length - 1));
	}
	
	median(arr) {
		// suppose the array sorted
		if (arr.length % 2 == 0) {
			const  halfLen = arr.length/2;
			return this.mean([arr[halfLen - 1], arr[halfLen]]);
		} else {
			const middle = (arr.length - 1)/2;
			return arr[middle];
		}
	}

	sort(arr) {
		// return a copy of arr sorted in a ascending order
		return arr.concat().sort((a, b) => { return a - b; });
	}

	updateAnalysisStat(question, intent, true_intent, confidenceLevel) { 
		t.push(chrono);
	}

	printAnalysis() {
		const mean = this.mean(t);
		const std_dev = this.std_dev(t, mean);

		let t_sorted = this.sort(t);  // sort ascending
		const min = t_sorted[0];
		const max = t_sorted[t.length - 1];
		const median = this.median(t_sorted);

		let result = ["", "",
			`Time analysis of the requests [${t.length}]:`,
			`Minimum (ms): \t${min}`,
			`Median (ms): \t${median}`,
			`Maximum (ms): \t${max}`, 
			"",
			`Mean (ms): \t\t\t${rnd(mean)}`,
			`Standard deviation (ms): \t${rnd(std_dev)}`,
		]
		console.log(result.join("\n"));
		logArray = logArray.concat(result);
	}
}


class AgregatorStat {
	constructor() {
		this.classes = [
			new RawStats(),
			new SimpleStats(),
			new PrecisionRecallStats(),
			new TimeStats()
		]
	}

	updateAnalysisStat(question, intent, true_intent, confidenceLevel) {
		for (let c of this.classes) {
			c.updateAnalysisStat(question, intent, true_intent, confidenceLevel)
		}
	}

	printAnalysis() {
		for (let c of this.classes) {
			c.printAnalysis()
		}
	}
}

////////////////////////
// the core functions


let stat = new AgregatorStat();
let logArray = [];
let chrono = 0; // contain time to measure the elipse of the query 
let t = []; // contain the elispses measure 


function loadQuery() {
	const test_set = require('./'+ questions_set_file);
	let QI = []
	for (let q in test_set) {
		QI.push({
			q:q,
			i:test_set[q]
		});
	}
	return QI;
}


function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}


function delay() {
	return sleep(INTER_REQUEST_MS);
}


function chronoStart() {
	return new Promise(resolve => {
		chrono = new Date().getTime();
		resolve();
	});
}


function chronoStop(res) {
	return new Promise(resolve => {
		chrono = new Date().getTime() - chrono;
		resolve(res);
	});
}


function queryQuestions(question) {
	return () => { // same structure than analyseResponse
		const request = {
			session: userContextD_test,
			queryInput: {
				text: {
					text: question,
					languageCode: languageCodeD,
				},
			},
		};
	
		return sessionClientD.detectIntent(request);
	}
}


function analyseResponse(true_intent) {
	// return a function that have in its scope the true intent
	return (response) => {
		// return a Promis to be able to call in the main a then
		return new Promise(resolve => {
			const question = response[0].queryResult.queryText;
			const intent = response[0].queryResult.intent.displayName;
			const confidenceLevel = response[0].queryResult.intentDetectionConfidence;
			stat.updateAnalysisStat(question, intent, true_intent, confidenceLevel);
			resolve();
		});
	};
}


function now() {
	// this replacement is necessary to make this string valid in filename (on Windows)
	return new Date().toJSON().replace(/:/g, "-");
}


function writeAnalysis() {
	if (WRITE_LOG || WRITE_TIMES) {
		if (!fs.existsSync("log")) {
			fs.mkdirSync("log");
		}
		
		if (WRITE_LOG) {
			const log_path = "log/run_" + now() + ".log";
			fs.writeFileSync(log_path, logArray.join("\n"));
		} 
		if (WRITE_TIMES) {
			const time_path = "log/times_" + now() + ".json";
			fs.writeFileSync(time_path, JSON.stringify(t, null, 4));
		}
	}
}


let print_error = (e) => { console.error("ERROR:\n" + e); process.exit();}


async function main() {
	const QIs = loadQuery();
	for (const QI of QIs) {
		await chronoStart()
			.then(queryQuestions(QI.q))
			.then(chronoStop)
			.then(analyseResponse(QI.i))
			.then(delay)
			.catch(print_error);
	}
	stat.printAnalysis();
	writeAnalysis();
}

main();