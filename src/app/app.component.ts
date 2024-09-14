import { Component } from '@angular/core';
import { EChartsOption } from 'echarts';
import { HttpClient } from '@angular/common/http';
import * as echarts from 'echarts';

const COMMUNITIES = ["Andalucia", "Aragon", "Asturias", "Baleares", "Canarias", "Cantabria", "Castilla-Leon", "Castilla-La Mancha", "Cataluña", "Valencia", "Extremadura", "Galicia", "Madrid", "Murcia", "Navarra", "Pais Vasco", "La Rioja", "Ceuta", "Melilla"]


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  public chartOption!: EChartsOption
  private data: any
  private selected_data!: any[]
  protected loading: boolean = false

  private min_value: number = Infinity
  private max_value: number = 0
  

  // Function to retreive the data from the csv file
  private retreive_data(data: string): void {
    let rows = data.split('\n')
    this.data = []
    for (let row of rows) {
      let tokens = row.split(';')
      if (tokens.length == 5) {
        let obj = {
          // TODO: Translate the input to the name of the community
          cod_ccaa: parseInt(tokens[1].split(' ')[0]),
          gender: tokens[2],
          date: tokens[3],
          value: parseInt(tokens[4].replace('.', ''))
        }
        this.data.push(obj)
        if (obj["value"] < this.min_value) {
          this.min_value = obj["value"]
        }
        if (obj["value"] > this.max_value) {
          this.max_value = obj["value"]
        }
      }
    }
  }

  private select_data(gender: string, date: string): void {
    this.selected_data = this.data.filter((obj: any) => obj["gender"] == gender && obj["date"] == date)
      .map((obj: any) => {
        return {
          name: COMMUNITIES[obj["cod_ccaa"]-1],
          value: obj["value"]
        }
      })
  }

  constructor(private http: HttpClient) {
    this.loading = true
    this.http.get('assets/data.csv', {responseType: 'text'}).subscribe((data) => {
      this.loading = false
      this.retreive_data(data)
      this.select_data('Hombres', "1 de julio de 2016")
      console.log(this.selected_data)

      this.http.get('assets/spain-communities.geojson').subscribe(
        (map: any) => {
          echarts.registerMap('ES', map)
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
            visualMap: {
              left: 'right',
              min: this.min_value,
              max: this.max_value,
              inRange: {
                color: ['lightskyblue', 'yellow', 'orangered']
              },
              text: ['Alta', 'Baja'],
              calculable: true
            },
            toolbox: {
              show: true,
              left: 'left',
              top: 'top',
              feature: {
                dataView: { readOnly: false },
                restore: {},
                saveAsImage: {}
              }
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
                },
                data: this.selected_data
              }
            ]
          };
        }
      );
    })
    
  }
}
