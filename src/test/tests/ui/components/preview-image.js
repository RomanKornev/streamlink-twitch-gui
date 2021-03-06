import { module, test } from "qunit";
import { setupRenderingTest } from "ember-qunit";
import { buildResolver } from "test-utils";
import { render } from "@ember/test-helpers";
import hbs from "htmlbars-inline-precompile";
import transparentImage from "transparent-image";

import { scheduleOnce } from "@ember/runloop";

import PreviewImageComponent from "ui/components/preview-image/component";


module( "ui/components/preview-image", function( hooks ) {
	setupRenderingTest( hooks, {
		resolver: buildResolver({
			PreviewImageComponent
		})
	});

	hooks.before(function() {
		this.webRequestCallback = () => ({ cancel: true });
		window.chrome.webRequest.onBeforeRequest.addListener(
			this.webRequestCallback,
			{ urls: [ "http://blocked/request" ] }
		);
	});

	hooks.after(function() {
		window.chrome.webRequest.onBeforeRequest.removeListener( this.webRequestCallback );
	});


	test( "Valid image source", async function( assert ) {
		assert.expect( 4 );

		await new Promise( async ( resolve, reject ) => {
			this.setProperties({
				src: transparentImage,
				title: "bar",
				onLoad: resolve,
				onError: reject
			});
			await render( hbs`
				{{preview-image src=src title=title onLoad=onLoad onError=onError}}
			` );

			assert.ok(
				this.element.querySelector( "img" ),
				"Has an image element before loading"
			);
		});

		assert.ok(
			this.element.querySelector( ".previewImage" ) instanceof HTMLImageElement,
			"Image loads correctly"
		);
		assert.strictEqual(
			this.element.querySelector( "img" ).getAttribute( "src" ),
			transparentImage,
			"Has the correct image source"
		);
		assert.strictEqual(
			this.element.querySelector( "img" ).getAttribute( "title" ),
			"bar",
			"Has the correct element title"
		);
	});


	test( "Invalid image source", async function( assert ) {
		assert.expect( 3 );

		await new Promise( async ( resolve, reject ) => {
			this.setProperties({
				src: "http://blocked/request",
				title: "bar",
				onLoad: reject,
				onError: resolve
			});
			await render( hbs`
				{{preview-image src=src title=title onLoad=onLoad onError=onError}}
			` );

			assert.ok(
				this.element.querySelector( "img" ),
				"Has an image element before loading"
			);
		});

		assert.ok(
			this.element.querySelector( ".previewError" ),
			"Is in error state"
		);
		assert.strictEqual(
			this.element.querySelector( ".previewError" ).getAttribute( "title" ),
			"bar",
			"Error element has a title"
		);
	});


	test( "Missing image source", async function( assert ) {
		await render( hbs`{{preview-image}}` );

		assert.notOk(
			this.element.querySelector( "img" ),
			"Does not have an image element"
		);

		await new Promise( resolve => scheduleOnce( "afterRender", resolve ) );

		assert.ok(
			this.element.querySelector( ".previewError" ),
			"Is in error state"
		);
	});

});
