import Login from './login/Login';

class App extends React.Component {
   render() {
      return (
         <div>
            <Login />
         </div>
      );
   }
}

ReactDOM.render(<App />, document.getElementById('app'));
