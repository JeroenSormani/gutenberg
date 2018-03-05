/**
 * External dependencies
 */
import { connect } from 'react-redux';
import Textarea from 'react-autosize-textarea';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component, compose } from '@wordpress/element';
import { keycodes } from '@wordpress/utils';
import { createBlock, getDefaultBlockName } from '@wordpress/blocks';
import { Button, Dashicon, withContext, Popover } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import PostPermalink from '../post-permalink';
import { getEditedPostAttribute } from '../../store/selectors';
import { insertBlock, editPost, clearSelectedBlock } from '../../store/actions';

/**
 * Constants
 */
const REGEXP_NEWLINES = /[\r\n]+/g;
const { ENTER } = keycodes;

class PostTitle extends Component {
	constructor() {
		super( ...arguments );

		this.bindContainer = this.bindNode.bind( this, 'container' );
		this.bindTextarea = this.bindNode.bind( this, 'textarea' );
		this.bindPostPermalink = this.bindNode.bind( this, 'permalink' );
		this.onChange = this.onChange.bind( this );
		this.onSelect = this.onSelect.bind( this );
		this.onUnselect = this.onUnselect.bind( this );
		this.onSelectionChange = this.onSelectionChange.bind( this );
		this.onKeyDown = this.onKeyDown.bind( this );
		this.blurIfOutside = this.blurIfOutside.bind( this );
		this.togglePermalink = this.togglePermalink.bind( this );

		this.nodes = {};

		this.state = {
			isSelected: false,
			permalinkOpen: false,
		};
	}

	componentDidMount() {
		document.addEventListener( 'selectionchange', this.onSelectionChange );
	}

	componentWillUnmount() {
		document.removeEventListener( 'selectionchange', this.onSelectionChange );
	}

	bindNode( name, node ) {
		this.nodes[ name ] = node;
	}

	onSelectionChange() {
		const textarea = this.nodes.textarea.textarea;
		if (
			document.activeElement === textarea &&
			textarea.selectionStart !== textarea.selectionEnd
		) {
			this.onSelect();
		}
	}

	onChange( event ) {
		const newTitle = event.target.value.replace( REGEXP_NEWLINES, ' ' );
		this.props.onUpdate( newTitle );
	}

	onSelect() {
		this.setState( { isSelected: ! this.state.permalinkOpen } );
		this.props.clearSelectedBlock();
	}

	onUnselect() {
		this.setState( { isSelected: false } );
	}

	blurIfOutside( event ) {
		if ( ! this.nodes.container.contains( event.relatedTarget ) ) {
			this.onUnselect();
		}
	}

	onKeyDown( event ) {
		if ( event.keyCode === ENTER ) {
			event.preventDefault();
			this.props.onEnterPress();
		}
	}

	togglePermalink() {
		const toggledPermalinkOpen = ! this.state.permalinkOpen;
		this.setState(
			{ permalinkOpen: toggledPermalinkOpen },
			function afterPermalinkOpenChange() {
				if ( toggledPermalinkOpen ) {
					this.nodes.permalink.getWrappedInstance().setFocus();
				}
			}
		);
	}

	render() {
		const { title, placeholder } = this.props;
		const { isSelected, permalinkOpen } = this.state;
		const className = classnames( 'editor-post-title', { 'is-selected': isSelected } );

		return (
			<div
				ref={ this.bindContainer }
				onFocus={ this.onSelect }
				onBlur={ this.blurIfOutside }
				className={ className }
				tabIndex={ -1 /* Necessary for Firefox to include relatedTarget in blur event */ }
			>
				<Button
					className="editor-post-title__permalink-button"
					onClick={ this.togglePermalink }>
					<Dashicon icon="admin-links" />
					{ permalinkOpen && (
						<Popover
							className="editor-post-title__permalink-popover"
							position="top right"
							focusOnMount={ false }
							onClose={ this.togglePermalink }
							onClick={ ( event ) => event.stopPropagation() }
						>
							<PostPermalink ref={ this.bindPostPermalink } />
						</Popover>
					) }
				</Button>
				<div>
					<Textarea
						ref={ this.bindTextarea }
						className="editor-post-title__input"
						value={ title }
						onChange={ this.onChange }
						placeholder={ placeholder || __( 'Add title' ) }
						onClick={ this.onSelect }
						onKeyDown={ this.onKeyDown }
						onKeyPress={ this.onUnselect }
					/>
				</div>
			</div>
		);
	}
}

const applyConnect = connect(
	( state ) => ( {
		title: getEditedPostAttribute( state, 'title' ),
	} ),
	{
		onEnterPress() {
			return insertBlock( createBlock( getDefaultBlockName() ), 0 );
		},
		onUpdate( title ) {
			return editPost( { title } );
		},
		clearSelectedBlock,
	}
);

const applyEditorSettings = withContext( 'editor' )(
	( settings ) => ( {
		placeholder: settings.titlePlaceholder,
	} )
);

export default compose(
	applyConnect,
	applyEditorSettings
)( PostTitle );
