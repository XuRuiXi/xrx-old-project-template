var content = myLib.createRoot(document.querySelector("#app"));
  var items = [
    { key: "1", label: "Tab 1", children: "111111" },
    { key: "2", label: "Tab 2", children: "22222222" },
    { key: "3", label: "Tab 3", children: "333333333" },
  ];
function onChange(e) {
  console.log(e);
}
content.render(myLib.Tabs({ items: items, onChange: onChange }));
