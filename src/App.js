import React, { Component } from 'react';
import ComponentsArea from './ComponentsArea';
import Controls from './Controls';

const { ipcRenderer } = window.require('electron');
const storage = window.require('electron-json-storage');

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      containers: [],
      filePath: '',
      directories: [],
      composed: []
    };
    this.showIds = this.showIds.bind(this);
    this.ps = this.ps.bind(this);
    this.dcps = this.dcps.bind(this);
    this.psa = this.psa.bind(this);
    this.dcup = this.dcup.bind(this);
    this.dcdwn = this.dcdwn.bind(this);
    this.stop = this.stop.bind(this);
    this.handleFilePath = this.handleFilePath.bind(this);
    this.open = this.open.bind(this);
    this.getDirectories = this.getDirectories.bind(this);
    this.clearHistory = this.clearHistory.bind(this);
    this.setFilePath = this.setFilePath.bind(this);
    this.composedInfo = this.composedInfo.bind(this);
  }

  componentDidMount() {
    ipcRenderer.on('item:add', (e, item) => {
      let size = 0;
      storage.getAll((err, data) => {
        if (err) throw err;
        size = Object.values(data).length;
        let flag = true;
        const arr = Object.values(data);
        arr.forEach((obj) => {
          if (obj.path === item) flag = false;
        });
        if (flag) {
          storage.set(String(size), { path: item }, (error) => {
            if (error) throw error;
            if (this.state.currentViewName === 'Saved directories') {
              const { directories } = this.state;
              directories.push(<li key={size} className="directoryItem" onClick={this.setFilePath}>{item}</li>);
              this.setState({
                directories,
              });
            }
          });
        }
        this.setState({
          filePath: item,
        });
      });
    });
  }

  getDirectories() {
    storage.getAll((error, data) => {
      if (error) throw error;
      const arr = Object.values(data);
      const directories = arr.map((path, i) => <li key={i} className="directoryItem" onClick={this.setFilePath}>{path.path}</li>);
      this.setState({
        containers: [],
        currentViewName: 'Saved directories',
        composed:[],
        directories,
      });
    });
  }

  setFilePath(e) {
    const filePath = e.target.innerHTML;
    this.setState({
      filePath,
    });
  }

  clearHistory() {
    storage.clear((err) => {
      if (err) throw err;
    });
    this.setState({
      directories: [],
    });
  }

  showIds(arr) {
    // console.log(this.state.containers);
    if (this.state.containers.length > 0) {
      return (
        <div>
          <h3 className="contLabel">Online</h3>
          {this.state.containers.map(container => 
            <div key={container['CONTAINER ID']} className="containers">
              {/* CONTAINER ID IMAGE COMMAND CREATED STATUS PORTS */}
              <p className="containerText">name: {container[' PORTS']}</p>
              <p className="containerText">ID: {container['CONTAINER ID']}</p>
            </div>)
          }
        </div>
      )
    }
  }

  composedInfo() {
    // console.log(this.state.composed);
    if (this.state.composed.length > 0) {
      return (
        <div>
          <h3 className="contLabel">Composed</h3>
          <div class="composeBox">
            {this.state.composed.map(container => 
              <div key={container['Name']} className="containers">
                <p className="containerText">Name: {container['Name']}</p>
                <p className="containerText">Ports: {container['Ports']}</p>
              </div>
            )}
          </div>
         </div>
      )
    }
  }

  handleFilePath(e) {
    e.preventDefault();
    this.setState({
      filePath: e.target[0].value,
    });
  }

  dcps() {
    // console.log('Hello from docker-compose ps!')
    fetch('/docker-composeps', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filePath: this.state.filePath,
      })
    }).then(res => res.json())
      .then((data) => {
        this.ps()
        this.setState({
          composed: data,
          currentViewName: 'Containers online',
          directories: []
        });
      });
  }

  ps() {
    fetch('/docker-ps', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }).then(res => res.json())
      .then((data) => {
        this.setState({
          containers: data,
          currentViewName: 'Containers online',
          directories: [],
        });
      });
  }

  psa() {
    fetch('/psa', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }).then(res => res.json())
      .then((data) => {
        this.setState({
          containers: data,
          currentViewName: 'All containers',
          directories: [],
        });
      });
  }

  dcup() {
    fetch('/dcup', {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        filePath: this.state.filePath,
      }),
    }).then(() => {
      this.dcps();
    });
  }

  dcdwn() {
    fetch('/dcdwn', {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        filePath: this.state.filePath,
      }),
    }).then(() => {
      this.setState({
        composed:[]
      })
    });
  }

  stop() {
    fetch('/dcstop', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }).then(() => {
      this.setState({
        containers: [],
        currentViewName: 'Containers online',
        directories: [],
        composed: []
      });
    });
  }

  open(e) {
    e.preventDefault();
    ipcRenderer.send('item:add');
  }

  render() {
    return (
      <div>
        <ComponentsArea
          comIds={this.showIds()}
          composedInfo={this.composedInfo()}
          currentViewName={this.state.currentViewName}
          filePath={this.state.filePath}
          clear={this.clearHistory}
          directories={this.state.directories}
        />
        <Controls
          dcps={this.dcps}
          fp={this.handleFilePath}
          ps={this.ps}
          psa={this.psa}
          dcup={this.dcup}
          dcdwn={this.dcdwn}
          stop={this.stop}
          open={this.open}
          file={this.state.filePath}
          directories={this.getDirectories}
        />
      </div>
    );
  }
}

export default App;
