# import matplotlib
# import statsmodels as sm
# import scipy.stats as st
# import pandas as pd
# import warnings
import json
import os

from scipy.stats import gamma
from scipy.stats import lognorm
from scipy.stats import pareto
from scipy.stats import norm
import numpy as np
import matplotlib.pyplot as plt


def warmup_filter(d):
    warm_up_measures = 2
    return d[warm_up_measures:]


def load_data():
    base_path = "./data"
    data_files_path = [os.path.join(base_path, f) for f in os.listdir(base_path) if os.path.isfile(os.path.join(base_path, f))]

    data_merged = []
    for f_path in data_files_path:
        with open(f_path) as f:
            data = json.load(f) # add a filter for the 2 first
            data_merged += warmup_filter(data)
    return data_merged


def compute_sse(times, d, arg, loc, scale):
    # source: https://stackoverflow.com/questions/6620471/fitting-empirical-distribution-to-theoretical-ones-with-scipy-python
    BINS = 50  # number of bar in the histogram
    y, x = np.histogram(times, bins=BINS, density=True)
    x = (x + np.roll(x, -1))[:-1] / 2.0 # x is now the value in the center of the bar

    # Calculate fitted PDF and error with fit in distribution
    pdf = d.pdf(x, *arg, loc=loc, scale=scale)
    sse = np.sum(np.power(y - pdf, 2.0))
    return sse


def fit_distributions(times):
    cut_off = 500
    distribution = {
        "Gamma": gamma,
        "Lognormal": lognorm,
        "Pareto": pareto,
        "Nomal": norm
    }

    fig, ax = plt.subplots(1, 1)
    best_sse = 1 # worse value possible in our case
    best_d = None
    best_d_str = None
    best_arg = []
    best_loc = None
    best_scale = None

    for d_str, d in distribution.items():
        params = d.fit(times, scale=10)

        # Separate parts of parameters
        arg = params[:-2]
        loc = params[-2]
        scale = params[-1]

        # check if better sse
        sse = compute_sse(times, d, arg, loc, scale)
        if sse < best_sse:
            best_sse = sse
            best_d = d
            best_d_str = d_str
            best_arg = arg
            best_loc = loc
            best_scale = scale

        # plot the distribution
        x = np.linspace(d.ppf(0.001, *arg, loc=loc, scale=scale),
                        d.ppf(0.99, *arg, loc=loc, scale=scale), 200)
        ax.plot(x, d.pdf(x, *arg, loc=loc, scale=scale), '-', lw=2, alpha=0.6, label=d_str+' pdf')


    # source clip: https://stackoverflow.com/questions/26218704/matplotlib-histogram-with-collection-bin-for-high-values
    ax.hist(np.clip(times, 0, cut_off), 50, density=True, histtype='stepfilled', alpha=0.2)
    
    ax.legend(loc='best', frameon=False)
    plt.xlabel('Response time')
    plt.ylabel('Probability density')
    plt.title('Distribution of response times')
    plt.show()

    print("The best distribution is the "+best_d_str+ (" with argument: " + str(best_arg) if len(best_arg) > 0 else "")+" [loc: "+str(best_loc)+" scale: "+str(best_scale)+"]")
    mean = best_d.mean(*best_arg, loc=best_loc, scale=best_scale)
    var = best_d.var(*best_arg, loc=best_loc, scale=best_scale)
    print("MODEL: Mean:", mean, "Variance:", var)
    print("DATA : Mean:", np.mean(times), "Variance:", np.var(times))

def main():
    times = load_data()
    fit_distributions(times)

if __name__ == "__main__":
    main()
