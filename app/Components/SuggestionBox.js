import React from 'react';
import Autocomplete from 'react-autocomplete';
import _ from 'lodash';

export let styles = {
  item: {
    padding: '2px 6px',
    cursor: 'default'
  },

  highlightedItem: {
    color: 'white',
    background: 'hsl(200, 50%, 50%)',
    padding: '2px 6px',
    cursor: 'default'
  },

  menu: {
    border: 'solid 1px #ccc'
  }
};

function matchFileToTerm (file, value) {
  return (
    file.title.toLowerCase().indexOf(value.toLowerCase()) !== -1
  )
}

function sortSounds (a, b, value) {
  return (
    a.title.toLowerCase().indexOf(value.toLowerCase()) >
    b.title.toLowerCase().indexOf(value.toLowerCase()) ? 1 : -1
  )
}

function getFiles (tree) {
  var files = _.map(tree, (folder) => {
    return folder._files;
  });

  return _.flatten(files);
}

export default class SuggestionBox extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      value: '',
      dataSource: [],
      files: [],
      displayFiles: []
    };
  }

  componentWillReceiveProps(newProps) {
    if (newProps.folders !== this.state.folders) {
      this.setState({
        folders: newProps.folders,
        files: getFiles(newProps.folders)
      });
    }
  }

  render() {
    const { value } = this.state;

    const inputProps = {
      placeholder: 'Type a sound name',
      value
    };

    return (
      <Autocomplete
        items={this.state.displayFiles}
        getItemValue={(item) => item.title}
        onChange={(event, value) => {
          let filteredFiles = _.filter(this.state.files, (file) => {
            return file.title.toLowerCase().indexOf(value.toLowerCase()) !== -1
          });
          this.setState({ displayFiles: filteredFiles, loading: false })
        }}
        inputProps={inputProps}
        sortItems={sortSounds}
        renderItem={(item, isHighlighted) => (
            <div
              style={isHighlighted ? styles.highlightedItem : styles.item}
            >{item.title}</div>
          )}
        />
    );
  }
}