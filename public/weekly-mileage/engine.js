let myChart;
let goalmileage = 0;
let mileagePerDay = {
    "Monday": 0,
    "Tuesday": 0,
    "Wednesday": 0,
    "Thursday": 0,
    "Friday": 0,
    "Saturday": 0,
    "Sunday": 0
}

let remainingMileage = 0;

let days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


function displayPage() {
    let daysHTML = "";
    for (let i = 0; i < days.length; i++) {
        daysHTML += `
                <div class="day">
                    <label for="${days[i]}">${days[i]}</label>
                    <input id="${days[i]}" type="number" min="0" oninput="calculateMileage()">
                </div>
           `
    }
    document.getElementById("days").innerHTML = daysHTML;
}


window.addEventListener("DOMContentLoaded", () => {
    // Display Days of Week
    const ctx = document.getElementById('myChart');
    const currentData = days.map(day => mileagePerDay[day]);
    const isDark = document.body.classList.contains('dark');
    const textColor = isDark ? '#e6e6e6' : '#1a1a1a';
    const gridColor = isDark ? '#333333' : '#e0e0e0';

    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: days,
            datasets: [{
                label: 'Mileage',
                data: currentData,
                borderWidth: 1,
                backgroundColor: isDark ? '#a3f5aa' : '#0a5c11'
            }]
        },
        options: {
            plugins: {
                legend: {
                    labels: {
                        color: textColor
                    }
                }
            },
            scales: {
                y: { 
                    beginAtZero: true,
                    ticks: {
                        color: textColor
                    },
                    grid: {
                        color: gridColor
                    }
                },
                x: {
                    ticks: {
                        color: textColor
                    },
                    grid: {
                        color: gridColor
                    }
                }
            }
        }
    });

    displayPage();

    document.getElementById("goal-mileage").addEventListener("input", calculateMileage);
});

function calculateMileage() {
    for (let day of days) {
        let input = document.getElementById(day).value;

        // If input is empty string OR is not a number, set to 0. Otherwise, parse it.
        mileagePerDay[day] = (input === "" || isNaN(input)) ? null : parseFloat(input);
        console.log(day, mileagePerDay[day]);
    }
    calculateRemaining(mileagePerDay);
    updateChart();
}


function calculateRemaining(mileagePerDay) {

    goalmileage = parseFloat(document.getElementById("goal-mileage").value)

    let totalRun = 0;

    for (let day of days) {
        totalRun += mileagePerDay[day];
    }
    remainingMileage = goalmileage - totalRun;
    document.getElementById("remaining-mileage").innerHTML = remainingMileage;
}

// Initilize array for days with zero miles 
function distributeRemaining() {
    let zeroDays = [];

    for (let day of days) {
        if (mileagePerDay[day] == null) {
            zeroDays.push(day);
        }
    }

    if (zeroDays.length < 1) {
        return;
    }

    let remainingMileagePerDay = parseFloat(remainingMileage / zeroDays.length)

    for (let day of zeroDays) {
        mileagePerDay[day] = remainingMileagePerDay;
        document.getElementById(day).value = remainingMileagePerDay;
        updateHTMLAfterDistribution();
    }

}

function updateHTMLAfterDistribution() {

    for (let day of days) {
        document.getElementById(`${day}`).innerHTML = mileagePerDay[day];
    }
    updateChart();

    // <input id="${days[i]}" type="number" min="0" oninput="calculateMileage()">

}


function updateChart() {
    // 2. Target the variable 'myChart' defined above

    // Updated Data
    let updatedData = days.map(day => mileagePerDay[day]);

    myChart.data.datasets[0].data = updatedData;

    // re render the chart
    myChart.update();
}



