import React from 'react';
import Autosuggest from 'react-autosuggest';
import scrollIntoView from 'dom-scroll-into-view';

// https://developer.mozilla.org/en/docs/Web/JavaScript/Guide/Regular_Expressions#Using_Special_Characters
function escapeRegexCharacters(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getSuggestionValue(suggestion) {
  return suggestion.title;
}

function getSectionSuggestions(section) {
  return section.files;
}


function renderSuggestion(suggestion) {
  return (
    <span>{suggestion.title}</span>
  );
}

function renderSectionTitle(section) {
  return (
    <strong>{section.title}</strong>
  );
}

function sortFiles(a, b, value) {
  if(value) {
    return (
      a.title.toLowerCase().indexOf(value.toLowerCase()) >
      b.title.toLowerCase().indexOf(value.toLowerCase()) ? 1 : -1
    )
  } else {
    return a.title === b.title? 0 : a.title< b.title? -1 : 1;
  }
}


export default class SuggestionBox extends React.Component {
  constructor() {
    super();

    this.state = {
      value: '',
      suggestions: this.getSuggestions(''),
      folders: []
    };

    this.onChange = this.onChange.bind(this);
    this.onSuggestionsUpdateRequested = this.onSuggestionsUpdateRequested.bind(this);
  }

  onChange(event, { newValue, method }) {
    // really ugly hack to get focused element scrolled into view
    // waiting for way to do this officially: https://github.com/moroshko/react-autosuggest/issues/21
    setTimeout(function() {
      var focusedElems = document.getElementsByClassName('react-autosuggest__suggestion--focused');
      if(focusedElems.length) {
        let itemNode = focusedElems[0];
        let menuNode = document.getElementsByClassName('react-autosuggest__suggestions-container')[0];
        scrollIntoView(itemNode, menuNode, {
          onlyScrollIfNeeded: true
        })
      }
    });

    this.setState({
      value: newValue
    });
  }

  getSuggestions(value) {
    let fileQ = escapeRegexCharacters(value.trim());

    if (fileQ === '') {
      return [];
    }

    let matchingFolders = this.state.folders;
    let suggestedFolders;


    // folder: search
    let folderSearch = value.split(':');
    if (folderSearch.length === 2) {
      const folderQ = folderSearch[0].trim();
      const folderRegex = new RegExp('^' + folderQ, 'i');
      fileQ = folderSearch[1].trim();

      matchingFolders = this.state.folders.filter(folder => folderRegex.test(folder.title))

    // Get folder hints
    } else {
      let filteredFolders = this.state.folders.filter(folder => (new RegExp(value, 'i')).test(folder.title));

      // Only add folder suggestions if we actually found any
      if (filteredFolders.length !== 0) {
        suggestedFolders = {
          title: 'folders suggestions',
          files: filteredFolders.map(folder => {
            return {title: folder.title}
          })
        }
      }
    }

    const fileRegex = new RegExp(fileQ, 'i');

    let results = matchingFolders
      .map(folder => {
        let files = fileQ ? folder.files.filter(file => fileRegex.test(file.title)) : folder.files;
        files = files.sort((a, b) => (
          sortFiles(a, b, fileQ)
        ));

        return {
          title: folder.title,
          files: files
        };
      })
      .filter(folder => folder.files.length > 0);

    if (suggestedFolders) {
      results = results.concat(suggestedFolders);
    }
    return results;
  }

  onSuggestionsUpdateRequested({ value }) {
    this.setState({
      suggestions: this.getSuggestions(value)
    });
  }

  componentWillReceiveProps(newProps) {
    if (newProps.folders !== this.state.folders) {
      this.setState({
        folders: newProps.folders
      });
    }
  }

  render() {
    const { value, suggestions } = this.state;
    const inputProps = {
      placeholder: "Search for a sound",
      value,
      onChange: this.onChange,
      onKeyDown: this.props.onKeyDown
    };

    return (
      <Autosuggest
        multiSection={true}
        onSuggestionSelected={this.props.onSuggestionSelected}
        suggestions={suggestions}
        onSuggestionsUpdateRequested={this.onSuggestionsUpdateRequested}
        getSuggestionValue={getSuggestionValue}
        renderSuggestion={renderSuggestion}
        renderSectionTitle={renderSectionTitle}
        getSectionSuggestions={getSectionSuggestions}
        inputProps={inputProps}/>
    );
  }
}
