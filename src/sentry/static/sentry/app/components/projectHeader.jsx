import React from "react";
import Router from "react-router";
import jQuery from "jquery";
import ConfigStore from "../stores/configStore";
import DropdownLink from "../components/dropdownLink";
import MenuItem from "../components/menuItem";

var ProjectSelector = React.createClass({
  childContextTypes: {
    router: React.PropTypes.func
  },

  getChildContext() {
    return {
      router: this.props.router
    };
  },

  getInitialState() {
    return {
      filter: ''
    };
  },

  onFilterChange(e) {
    this.setState({
      filter: e.target.value
    });
  },

  onKeyUp(e) {
    if (event.key === 'Escape' || event.keyCode === 27) {
      // blur handler should additionally hide dropdown
      this.close();
    }
  },

  onFilterBlur() {
    // HACK: setTimeout because blur might be caused by clicking
    // project link; in which case, will close dropdown before
    // link click is processed. Why 200ms? Decently short time
    // period that seemed to work in all browsers.
    setTimeout(() => this.close(), 200);
  },

  close() {
    this.setState({ filter: '' });
    this.refs.dropdownLink.close();
  },

  highlight(text, highlightText) {
    if (!highlightText) {
      return text;
    }
    highlightText = highlightText.toLowerCase();
    var idx = text.toLowerCase().indexOf(highlightText);
    if (idx === -1) {
      return text;
    }
    return (
      <span>
        {text.substr(0, idx)}
        <strong className="highlight">
          {text.substr(idx, highlightText.length)}
        </strong>
        {text.substr(idx + highlightText.length)}
      </span>
    );
  },

  getProjectNode(team, project, highlightText) {
    var org = this.props.organization;
    var projectRouteParams = {
      orgId: org.slug,
      projectId: project.slug
    };

    return (
      <MenuItem key={project.slug} to="projectDetails"
            params={projectRouteParams}>
        {this.highlight(project.name, highlightText)}
      </MenuItem>
    );
  },

  onOpen(event) {
    this.refs.filter.getDOMNode().focus();
  },

  onClose() {
    this.setState({
      filter: ''
    });
  },

  componentDidUpdate(prevProps, prevState) {
    // XXX(dcramer): fix odd dedraw issue as of Chrome 45.0.2454.15 dev (64-bit)
    var node = jQuery(this.refs.container.getDOMNode());
    node.hide().show(0);
  },

  render() {
    var projectId = this.props.projectId;
    var org = this.props.organization;
    var filter = this.state.filter;
    var children = [];
    var activeTeam;
    var activeProject;
    var projectRouteParams = {
      orgId: org.slug,
      projectId: projectId
    };

    org.teams.forEach((team) => {
      if (!team.isMember) {
        return;
      }
      var hasTeam = false;
      team.projects.forEach((project) => {
        if (project.slug == this.props.projectId) {
          activeTeam = team;
          activeProject = project;
        }
        var fullName = [team.name, project.name, team.slug, project.slug].join(' ').toLowerCase();
        if (filter && fullName.indexOf(filter) === -1) {
          return;
        }
        if (!hasTeam) {
          children.push((
            <li className="team-name" key={'_team' + team.slug}>
              {this.highlight(team.name, this.state.filter)}
            </li>
          ));
          hasTeam = true;
        }
        children.push(this.getProjectNode(team, project, this.state.filter));
      });
    });

    var activeProjectName;
    if (activeProject.name.indexOf(activeTeam.name) === -1) {
      activeProjectName = activeTeam.name + ' / ' + activeProject.name;
    } else {
      activeProjectName = activeProject.name;
    }

    return (
      <div className="project-select" ref="container">
        <Router.Link to="stream" params={projectRouteParams}>{activeProjectName}</Router.Link>
        <DropdownLink ref="dropdownLink" title="" topLevelClasses="project-dropdown"
            onOpen={this.onOpen} onClose={this.onClose}>
          <li className="project-filter" key="_filter">
            <input
              value={this.state.filter}
              type="text"
              placeholder="Filter projects"
              onChange={this.onFilterChange}
              onKeyUp={this.onKeyUp}
              onBlur={this.onFilterBlur}
              ref="filter" />
          </li>
          {children}
        </DropdownLink>
      </div>
    );
  }
});

var ProjectHeader = React.createClass({
  contextTypes: {
    router: React.PropTypes.func
  },

  render() {
    var routeParams = this.context.router.getCurrentParams();
    var navSection = this.props.activeSection;
    var urlPrefix = ConfigStore.get('urlPrefix');
    var project = this.props.project;
    var org = this.props.organization;

    return (
      <div>
        <div className="sub-header">
          <div className="container">
            <div className="pull-right">
              <ul className="nav nav-tabs">
                <li className={navSection == 'dashboard' ? 'active': ''}>
                  <Router.Link to="projectDashboard" params={routeParams}>
                    Dashboard
                  </Router.Link>
                </li>
                <li className={navSection == 'stream' ? 'active': ''}>
                  <Router.Link to="stream" params={routeParams}>
                    Stream
                  </Router.Link>
                </li>
                <li className={navSection == 'releases' ? 'active': ''}>
                  <Router.Link to="projectReleases" params={routeParams}>
                    Releases
                  </Router.Link>
                </li>
                <li className={navSection == 'settings' ? 'active': ''}>
                  <a href={urlPrefix + '/' + routeParams.orgId + '/' + routeParams.projectId + '/settings/'}>
                    Settings
                  </a>
                </li>
              </ul>
            </div>
            <ProjectSelector
                organization={org}
                projectId={project.slug}
                router={this.context.router} />
           </div>
        </div>
      </div>
    );
  }
});

export default ProjectHeader;
