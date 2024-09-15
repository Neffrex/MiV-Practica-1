import { Component } from '@angular/core';
import { EChartsOption } from 'echarts';
import { HttpClient } from '@angular/common/http';
import * as echarts from 'echarts';

const COMMUNITIES = ["Undefined", "Andalucia", "Aragon", "Asturias", "Baleares", "Canarias", "Cantabria", "Castilla-Leon", "Castilla-La Mancha", "Cataluña", "Valencia", "Extremadura", "Galicia", "Madrid", "Murcia", "Navarra", "Pais Vasco", "La Rioja", "Ceuta", "Melilla"]
const DATES = ["1 de enero de 2000", "1 de julio de 2000", "1 de enero de 2001", "1 de julio de 2001", "1 de enero de 2002", "1 de julio de 2002", "1 de enero de 2003", "1 de julio de 2003", "1 de enero de 2004", "1 de julio de 2004", "1 de enero de 2005", "1 de julio de 2005", "1 de enero de 2006", "1 de julio de 2006", "1 de enero de 2007", "1 de julio de 2007", "1 de enero de 2008", "1 de julio de 2008", "1 de enero de 2009", "1 de julio de 2009", "1 de enero de 2010", "1 de julio de 2010", "1 de enero de 2011", "1 de julio de 2011", "1 de enero de 2012", "1 de julio de 2012", "1 de enero de 2013", "1 de julio de 2013", "1 de enero de 2014", "1 de julio de 2014", "1 de enero de 2015", "1 de julio de 2015", "1 de enero de 2016", "1 de julio de 2016", "1 de enero de 2017", "1 de julio de 2017", "1 de enero de 2018", "1 de julio de 2018", "1 de enero de 2019", "1 de julio de 2019", "1 de enero de 2020", "1 de julio de 2020"]

interface Data {
  [gender: string]: {
    [date: string]: [{
      name: string,
      value: number
    }]
  }
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  public chartOption!: EChartsOption
  protected loading: boolean = false

  private min_value: number = Infinity
  private max_value: number = 0

  // Function to retreive the data from the csv file
  private retreive_data(raw_data: string): Data {
    let rows = raw_data.split('\n');
    rows.shift(); // Remove the header

    let data: Data = {
      "Hombres": {},
      "Mujeres": {},
      "Total": {}
    };

    for (let row of rows) {
      let tokens = row.split(';')
      if (tokens.length == 5) {
        let community_code = parseInt(tokens[1].split(' ')[0]);
        let community_name = COMMUNITIES[community_code];
        let gender = tokens[2];
        let date = tokens[3];
        let value = parseInt(tokens[4].replace(/\./g, ''));
        
        let obj = {
          name: community_name,
          value: value
        }
        if (!(date in data[gender])) {
          data[gender][date] = [obj];
        } else {
          data[gender][date].push(obj);
        }
        
        if (value < this.min_value) {
          this.min_value = value
        }
        if (value > this.max_value) {
          this.max_value = value
        }

      }
    }
    return data;
  }

  private configureChart(data: Data, gender: string) {
    let options = []
    for(let date of DATES) {
      options.push({ 
        series: {
          data: data[gender][date]
        }
      })
    }
    const allValues: number[] = [];
    Object.values(data[gender]).forEach((regions: any[]) => {
      regions.forEach((region) => {
        allValues.push(region.value);
      });
    });
    
    // Step 2: Find the minimum and maximum values
    const min_value = Math.min(...allValues);
    const max_value = Math.max(...allValues);

    console.log(data[gender]["1 de julio de 2000"])
    this.chartOption = {
      title: {
        text: 'Distribución de la población de España',
        subtext: 'Datos proporcionados por datos.gob.es',
        sublink: 'https://datos.gob.es/es/catalogo/ea0010587-poblacion-residente-por-fecha-sexo-y-edad-ecp-identificador-api-569401',
        left: 'right'
      },
      tooltip: {
        trigger: 'item',
        showDelay: 0,
        transitionDuration: 0.2
      },
      timeline: {
        axisType: 'category',
        autoPlay: true,
        playInterval: 1000,
        data: DATES
      },
      visualMap: {
        left: 'right',
        min: min_value,
        max: max_value,
        inRange: {
          color: ['lightskyblue', 'yellow', 'orangered']
        },
        text: ['Alta', 'Baja'],
        calculable: true
      },
      series: [
        {
          name: 'Población',
          type: 'map',
          roam: true,
          map: 'ES',
          emphasis: {
            label: {
              show: true
            }
          }
        }
      ],
      options: options,
    };
  }

  constructor(private http: HttpClient) {
    this.loading = true
    this.http.get('assets/data.csv', {responseType: 'text'}).subscribe((raw_data) => {
      let data = this.retreive_data(raw_data)

      this.http.get('assets/spain-communities.geojson').subscribe(
        (map: any) => {
          echarts.registerMap('ES', map)
          this.configureChart(data, 'Hombres')
          this.loading = false
        }
      );
    })
    
  }
}
