import React, { useState } from 'react';

const title = "welcome to react";

const App = () => {
  const mylist=[{"student": {"name":"john", "age": 20}}, 
                {"student": {"name":"doe", "age": 22}}, 
                {"student": {"name":"smith", "age": 21}}
               ];
  
  const [searched, setsearched] = useState("doe");
  React.useEffect(() => {
    localStorage.setItem('search', searched);
    }, [searched]);
  const handleSearch=(event)=>{
    setsearched(event.target.value)
  }
  const filteredList = mylist.filter((item) => item.student.name.toLowerCase().includes(searched.toLowerCase()));
  return(
     <div> 
       {title}  <br />
    <Search search={searched} onChange={handleSearch} />
    <p>You are searching for: {searched}</p>
    <List mylist={filteredList} />
   </div>
  );
}
const List = ({mylist}) => {
  return(<div>{mylist.map((list) =>
       {
         return <Item item={list} />
       }
       )
       }</div>)

}

const Item=(props)=>{
  return(<ul>{props.item["student"]["name"]} <br /> 
  {props.item["student"]["age"]}</ul>)
}

const Search = (props) => {

  return(
    <div>
       <label htmlFor="search">Search:</label>
       <input type="text" id="search" value={props.search} onChange={props.onChange} />

    </div>
  ) 
}

export default App;