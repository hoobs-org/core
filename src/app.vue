<template>
    <div id="app" :class="$client.theme || `${system}-light`" v-on:click="hide('service', 'instance')">
        <div class="header">
            <div v-if="system === 'hoobs'" class="title">
                <div class="logo">
                    <svg v-if="($client.theme || `${system}-light`).endsWith('dark')" width="27" height="27" viewBox="0 0 80 80.92" xmlns="http://www.w3.org/2000/svg">
                        <path class="header-logo-svg" d="M65.05,0H15A15.08,15.08,0,0,0,0,15.12V65.8A15.09,15.09,0,0,0,15,80.92h50.1A15.09,15.09,0,0,0,80,65.8V15.12A15.08,15.08,0,0,0,65.05,0Zm2,39.07a2.09,2.09,0,0,1-1.79,1.71,1.76,1.76,0,0,1-2.09-1c-.83-2.21-2.63-3.55-4.2-5.07a5.66,5.66,0,0,1-2-4.81c.09-1.24,0-2.49,0-3.73h0c0-1.66,0-3.32,0-5,0-1.5-.94-1.78-2.15-1.76s-2.64-.21-2.72,1.65c-.07,1.5,0,3-.06,4.51,0,.5.25,1.2-.23,1.44s-.83-.45-1.18-.78c-3.29-3.11-6.59-6.22-9.83-9.39-1-1-1.74-1-2.71,0Q27.51,27.79,16.75,38.57c-.94.94-1.07,1.7,0,2.57.24.19.44.44.66.65,1.41,1.4,1.62,1.36,3.13,0,4.68-4.35,9.08-9,13.63-13.48,1-.94,2-1.81,2.93-2.74a3.81,3.81,0,0,1,5.74,0c2,1.9,3.84,3.89,5.78,5.82C52.18,34.88,55.8,38.4,59.37,42c2.35,2.36,2.31,4.44,0,6.83-3.65,3.72-5.08,3.7-8.77,0-3.21-3.2-6.5-6.32-9.7-9.53-1-1-1.76-.91-2.71.06Q33,44.63,27.81,49.8c-.91.9-.91,1.65,0,2.48a13.05,13.05,0,0,1,1,1,1.48,1.48,0,0,0,2.48,0c1.82-1.83,3.7-3.59,5.55-5.38a4,4,0,0,1,5.9-.13q3.09,2.91,6.07,6a4,4,0,0,1,0,5.72c-1.36,1.47-2.82,2.87-4.23,4.3a8.46,8.46,0,0,0-2.22,2.92,1.84,1.84,0,0,1-2.1,1.23,2,2,0,0,1-1.84-1.63,2.09,2.09,0,0,1,1.09-2.5c2.93-1.4,4.61-4.19,6.94-6.26a1.08,1.08,0,0,0,0-1.75l-5.57-5.59c-.75-.75-1.43-.54-2.13.14-1.84,1.8-3.71,3.57-5.56,5.37a4,4,0,0,1-5.9.26c-.51-.43-1-.92-1.44-1.4-2.38-2.44-2.38-4.57,0-7Q31,42.31,36.22,37c2.22-2.23,4.32-2.25,6.57-.06l10.6,10.39c1.5,1.46,1.67,1.44,3.45-.37,1.51-1.54,1.53-1.76,0-3.25-5.21-5.21-10.46-10.39-15.65-15.62-.88-.89-1.58-.95-2.46-.07-2.41,2.4-4.84,4.77-7.27,7.16q-4.8,4.71-9.59,9.42a3.94,3.94,0,0,1-5.79.13c-3.81-3.46-4.75-5.29-.33-9.57,6.88-6.67,13.53-13.58,20.29-20.39,2.41-2.43,4.49-2.44,6.91-.07,1.65,1.62,3.35,3.2,5,4.81.68.66,1.15,1.07,1.51-.3a3.4,3.4,0,0,1,3-2.57,14.24,14.24,0,0,1,1.83-.21c4.28-.12,5.77,1.36,5.78,5.68,0,2.6,0,5.19,0,7.78a3.09,3.09,0,0,0,1.06,2.61c1.66,1.44,2.86,3.38,5,4.27A1.88,1.88,0,0,1,67.1,39.07Z" />
                    </svg>
                    <svg v-else width="27" height="27" viewBox="0 0 80 80.92" xmlns="http://www.w3.org/2000/svg">
                        <rect class="header-logo-svg-stroke" x="1.25" y="1.25" width="77" height="78" rx="16.3" />
                        <path class="header-logo-svg" d="M17,44.62a3.78,3.78,0,0,0,5.56-.13q4.63-4.53,9.24-9.08c2.33-2.3,4.68-4.59,7-6.91.85-.84,1.52-.78,2.37.08,5,5,10,10,15.07,15.05,1.44,1.43,1.42,1.65,0,3.13-1.71,1.75-1.88,1.77-3.32.36q-5.1-5-10.21-10c-2.16-2.11-4.18-2.1-6.32,0q-5,5.07-10.06,10.17c-2.28,2.32-2.27,4.37,0,6.72.45.46.89.94,1.38,1.35a3.87,3.87,0,0,0,5.68-.25C35.16,53.42,37,51.71,38.73,50c.67-.66,1.33-.85,2.05-.13,1.79,1.79,3.57,3.59,5.36,5.39a1,1,0,0,1,0,1.69c-2.24,2-3.86,4.68-6.68,6a2,2,0,0,0-1,2.41,1.89,1.89,0,0,0,1.76,1.56,1.78,1.78,0,0,0,2-1.17,8,8,0,0,1,2.13-2.82c1.36-1.38,2.76-2.72,4.08-4.14a3.85,3.85,0,0,0,0-5.52c-1.92-2-3.86-3.86-5.85-5.74a3.8,3.8,0,0,0-5.67.13c-1.78,1.73-3.59,3.43-5.34,5.18-.86.86-1.59.87-2.39,0-.29-.33-.61-.65-.93-1-.87-.81-.87-1.53,0-2.39q5-5,10-10.07c.91-.93,1.64-1,2.61-.06,3.08,3.09,6.25,6.1,9.34,9.19,3.55,3.54,4.92,3.55,8.44,0,2.26-2.3,2.29-4.31,0-6.58-3.44-3.44-6.92-6.84-10.36-10.27-1.87-1.86-3.68-3.78-5.56-5.61a3.66,3.66,0,0,0-5.53,0c-.93.89-1.91,1.74-2.82,2.64-4.38,4.33-8.62,8.8-13.12,13-1.45,1.34-1.66,1.38-3,0-.21-.21-.4-.44-.63-.63-1-.83-.88-1.56,0-2.47Q28,28.25,38.26,17.78a1.55,1.55,0,0,1,2.61,0c3.12,3,6.29,6,9.46,9.06.33.31.6,1,1.13.75s.22-.91.23-1.39c0-1.45,0-2.9.05-4.35.08-1.79,1.43-1.56,2.62-1.59s2.07.24,2.07,1.69c0,1.6,0,3.2,0,4.8h0c0,1.2.08,2.4,0,3.6A5.48,5.48,0,0,0,58.3,35c1.51,1.46,3.25,2.75,4.05,4.89a1.69,1.69,0,0,0,2,.91,2,2,0,0,0,1.72-1.65,1.81,1.81,0,0,0-.92-2.18c-2.07-.86-3.23-2.73-4.82-4.11a3,3,0,0,1-1-2.52c0-2.5,0-5,0-7.5,0-4.17-1.45-5.59-5.56-5.48a13,13,0,0,0-1.76.21A3.29,3.29,0,0,0,49.14,20c-.35,1.32-.8.93-1.45.3-1.6-1.56-3.23-3.08-4.82-4.64-2.33-2.28-4.34-2.28-6.66.06C29.71,22.3,23.31,29,16.69,35.39,12.44,39.52,13.34,41.28,17,44.62Z" />
                    </svg>
                </div>
                <h1 class="title-logo-text">{{ title }}</h1>
                <h1 class="mobile-hide" v-html="routeName()"></h1>
            </div>
            <div v-if="system === 'rocket'" class="title">
                <div class="logo">
                    <svg width="27" height="27" viewBox="0 0 27.1 27" xmlns="http://www.w3.org/2000/svg">
                        <path class="header-logo-svg" d="M27,8.9c-0.1-0.6-0.2-1.2-0.6-1.7c-0.4-0.7-1.1-1.1-1.8-1.5c-1.3-0.8-2.6-1.5-3.9-2.2 c-1.6-0.9-3.3-1.9-4.9-2.8C15.1,0.2,14.4,0,13.6,0c-1,0-2,0.4-2.8,0.9C9.2,1.8,7.6,2.7,6,3.6C4.7,4.4,3.4,5.1,2.2,5.9 C1.6,6.2,1.1,6.6,0.7,7.2C0.5,7.5,0.4,7.7,0.3,8C0.1,8.7,0,9.3,0,10c0,1.8,0,3.6,0,5.4c0,1.3,0,2.6,0,3.9c0,0.5,0,1,0.1,1.5 c0.1,0.9,0.5,1.7,1.2,2.4c0.1,0.1,0.2,0.2,0.3,0.1c0.5-0.3,1-0.3,1.5-0.3c1.4,0.1,2.5,0.8,3,2.2c0,0.1,0.1,0.2,0.2,0.2 c0.6-0.1,1.2,0.1,1.8,0.5C8.5,26.3,9,26.7,9.6,27c0.2,0,0.4,0,0.6,0c0.5-0.2,0.7-0.6,0.9-1.2c0.1,0.1,0.1,0.2,0.2,0.3 c0.6,0.7,1.3,0.7,1.8-0.1c0.3-0.4,0.4-0.9,0.4-1.4c0.1-0.2,0-0.3,0-0.5c0-1.2-0.2-2.4-0.4-3.6c0-0.2,0-0.3,0.2-0.2 c0.3,0.1,0.5,0,0.8,0c0.2,0,0.2,0,0.2,0.2c-0.1,0.5-0.2,1.1-0.3,1.6c-0.1,0.8-0.2,1.7-0.1,2.5c0,0.6,0.1,1.2,0.6,1.6 c0.5,0.5,1,0.4,1.4-0.1c0.1-0.1,0.2-0.3,0.3-0.4c0.1,0.5,0.4,0.9,0.8,1.1c0.2,0,0.4,0,0.6,0c0.6-0.2,1.1-0.7,1.5-1.2 c0.5-0.3,1.1-0.5,1.7-0.5c0.1,0,0.2,0,0.2-0.2c0.6-1.3,1.6-2,3-2.2c0.5,0,1.1,0.1,1.5,0.3c0.2,0.1,0.3,0,0.3-0.1 c0.6-0.6,0.9-1.3,1.1-2.1c0-0.2,0-0.3,0.1-0.5c0-0.4,0-0.8,0-1.2c0-3.4,0-6.8,0-10.2C27,9.1,27,9,27,8.9z M16.2,10 c0.3,1.1,0.5,2.1,0.6,3.2c0,1-0.1,2-0.4,2.9c0,0.1-0.1,0.3,0.1,0.3h0c1.1,0.9,1.4,2.1,1.2,3.4c-0.1,0.8-0.3,1.6-0.5,2.4 c-0.1-0.2-0.2-0.4-0.2-0.5c-0.4-1-0.9-1.9-1.7-2.7c-0.2-0.2-0.3-0.2-0.5,0c-0.2,0.3-0.5,0.4-0.8,0.4c-0.3,0-0.6,0-0.9,0 c-0.3,0-0.7-0.1-0.8-0.5c-0.1-0.3-0.3-0.2-0.4,0c-0.8,0.7-1.3,1.7-1.7,2.7C10,22,10,22.1,9.9,22.3c-0.1-0.2-0.1-0.4-0.2-0.6 c-0.2-0.7-0.3-1.4-0.4-2c-0.1-1.2,0.2-2.3,1.2-3.1c0.1-0.1,0.2-0.1,0.1-0.3c-0.4-1.2-0.5-2.4-0.4-3.6c0.1-0.9,0.3-1.8,0.6-2.7l0,0 c0.5-1.3,1.2-2.6,2.1-3.7c0.6-0.7,0.6-0.7,1.2,0C15.1,7.4,15.7,8.6,16.2,10" />
                        <path class="header-logo-svg" d="M13.5,11c-0.8,0-1.5,0.7-1.5,1.5c0,0.8,0.7,1.5,1.5,1.5c0.8,0,1.5-0.7,1.5-1.5C15.1,11.6,14.4,11,13.5,11z" />
                    </svg>
                </div>
                <h1 class="mobile-hide" v-html="routeName()"></h1>
            </div>
            <div v-if="instances.length > 1" class="instance" v-on:click.stop="toggle('instance')">
                {{ $bridge.name }}
                <span class="icon">arrow_drop_down</span>
            </div>
            <div v-if="user" v-on:click.stop="toggle('service')" class="icon service">more_vert</div>
            <div v-if="locked" class="service-loader">
                <loading-marquee :height="2" color="--title-text-dim" background="--title-text" />
            </div>
        </div>
        <div v-if="loaded" class="layout">
            <div v-if="user" class="nav">
                <div class="routes">
                    <div class="action-link" v-on:click.stop="toggle('nav')">
                        <span v-if="visible['nav']" class="icon">chevron_left</span>
                        <span v-else class="icon">chevron_right</span>
                    </div>
                    <div class="action-seperator">
                        <div></div>
                    </div>
                    <router-link :to="defaultRoute === 'status' ? '/' : '/status'" @click.native="hide('nav')">
                        <span v-bind:class="activeIcon('status')">dashboard</span>
                        <span v-if="visible['nav']" v-bind:class="activeLink('status')">{{ routeName('status') }}</span>
                    </router-link>
                    <router-link :to="defaultRoute === 'accessories' ? '/' : '/accessories'" @click.native="hide('nav')">
                        <span v-bind:class="activeIcon('accessories', 'layout')">highlight</span>
                        <span v-if="visible['nav']" v-bind:class="activeLink('accessories', 'layout')">{{ routeName('accessories') }}</span>
                    </router-link>
                    <router-link :to="defaultRoute === 'log' ? '/' : '/log'" @click.native="hide('nav')">
                        <span v-bind:class="activeIcon('log')">subject</span>
                        <span v-if="visible['nav']" v-bind:class="activeLink('log')">{{ routeName('log') }}</span>
                    </router-link>
                    <router-link to="/users" @click.native="hide('nav')" class="mobile-hide">
                        <span v-bind:class="activeIcon('users')">people</span>
                        <span v-if="visible['nav']" v-bind:class="activeLink('users')">{{ routeName('users') }}</span>
                    </router-link>
                    <router-link :to="defaultRoute === 'plugins' ? '/' : '/plugins'" @click.native="hide('nav')" class="mobile-hide">
                        <span v-bind:class="activeIcon('plugins', 'plugin', 'search')">extension</span>
                        <span v-if="visible['nav']" v-bind:class="activeLink('plugins', 'plugin', 'search')">{{ routeName('plugins') }}</span>
                    </router-link>
                </div>
                <div class="routes">
                    <router-link to="/config" @click.native="hide('nav')" class="mobile-hide">
                        <span v-bind:class="activeIcon('config', 'config-advanced')">settings</span>
                    </router-link>
                </div>
            </div>
            <div class="content">
                <router-view />
                <service-menu v-if="visible['service']" :about="showAbout" />
                <instance-menu v-if="visible['instance']" />
            </div>
        </div>
        <modal-dialog v-if="about && system === 'hoobs'" width="550px" :donate="donate" :ok="closeAbout">
            <svg version="1.1" width="177px" height="37.9px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 177 37.9">
                <path fill="#f9bd2b" d="M29.3,1H7C3.3,1,0.3,4,0.3,7.7v22.5c0,3.7,3,6.7,6.6,6.7h22.3c3.7,0,6.6-3,6.6-6.7V7.7C35.9,4,32.9,1,29.3,1z M30.2,18.3c-0.1,0.4-0.4,0.7-0.8,0.8c-0.4,0.1-0.8-0.1-0.9-0.4c-0.4-1-1.2-1.6-1.9-2.3c-0.6-0.6-0.9-1.3-0.9-2.1c0-0.6,0-1.1,0-1.7 c0,0,0,0,0,0c0-0.7,0-1.5,0-2.2c0-0.7-0.4-0.8-1-0.8c-0.5,0-1.2-0.1-1.2,0.7c0,0.7,0,1.3,0,2c0,0.2,0.1,0.5-0.1,0.6 c-0.2,0.1-0.4-0.2-0.5-0.3c-1.5-1.4-2.9-2.8-4.4-4.2c-0.4-0.4-0.8-0.4-1.2,0c-3.2,3.2-6.4,6.4-9.5,9.6c-0.4,0.4-0.5,0.8,0,1.1 c0.1,0.1,0.2,0.2,0.3,0.3c0.6,0.6,0.7,0.6,1.4,0c2.1-1.9,4-4,6.1-6c0.4-0.4,0.9-0.8,1.3-1.2c0.8-0.8,1.7-0.8,2.6,0 c0.9,0.8,1.7,1.7,2.6,2.6c1.6,1.6,3.2,3.2,4.8,4.7c1,1,1,2,0,3c-1.6,1.7-2.3,1.6-3.9,0c-1.4-1.4-2.9-2.8-4.3-4.2 c-0.4-0.4-0.8-0.4-1.2,0c-1.5,1.6-3.1,3.1-4.6,4.6c-0.4,0.4-0.4,0.7,0,1.1c0.2,0.1,0.3,0.3,0.4,0.4c0.4,0.4,0.7,0.4,1.1,0 c0.8-0.8,1.6-1.6,2.5-2.4c0.8-0.8,1.8-0.8,2.6-0.1c0.9,0.9,1.8,1.7,2.7,2.6c0.7,0.7,0.7,1.8,0,2.5c-0.6,0.7-1.3,1.3-1.9,1.9 c-0.4,0.4-0.8,0.8-1,1.3c-0.1,0.4-0.5,0.6-0.9,0.5c-0.4-0.1-0.7-0.3-0.8-0.7c-0.1-0.5,0-0.9,0.5-1.1c1.3-0.6,2.1-1.9,3.1-2.8 c0.3-0.2,0.3-0.5,0-0.8c-0.8-0.8-1.6-1.7-2.5-2.5c-0.3-0.3-0.6-0.2-0.9,0.1c-0.8,0.8-1.7,1.6-2.5,2.4c-0.8,0.8-1.7,0.8-2.6,0.1 c-0.2-0.2-0.4-0.4-0.6-0.6c-1.1-1.1-1.1-2,0-3.1c1.5-1.6,3.1-3.1,4.6-4.7c1-1,1.9-1,2.9,0c1.6,1.5,3.1,3.1,4.7,4.6 c0.7,0.7,0.7,0.6,1.5-0.2c0.7-0.7,0.7-0.8,0-1.4c-2.3-2.3-4.7-4.6-7-6.9c-0.4-0.4-0.7-0.4-1.1,0c-1.1,1.1-2.2,2.1-3.2,3.2 c-1.4,1.4-2.8,2.8-4.3,4.2c-0.8,0.8-1.8,0.8-2.6,0.1c-1.7-1.5-2.1-2.4-0.1-4.3c3.1-3,6-6,9-9.1c1.1-1.1,2-1.1,3.1,0 c0.7,0.7,1.5,1.4,2.2,2.1c0.3,0.3,0.5,0.5,0.7-0.1c0.2-0.7,0.7-1,1.3-1.1c0.3,0,0.5-0.1,0.8-0.1c1.9-0.1,2.6,0.6,2.6,2.5 c0,1.2,0,2.3,0,3.5c0,0.5,0.1,0.9,0.5,1.2c0.7,0.6,1.3,1.5,2.2,1.9C30.1,17.5,30.3,17.9,30.2,18.3z" />
                <path fill="#f9bd2b" d="M66.7,1.4v24.5h-5.7v-10H50v10h-5.7V1.4H50V11h11.1V1.4H66.7z M71,13.6C71,6.3,76.7,1,84.4,1 c7.7,0,13.4,5.3,13.4,12.6c0,7.3-5.7,12.6-13.4,12.6C76.7,26.2,71,20.9,71,13.6z M92,13.6c0-4.6-3.3-7.8-7.7-7.8 c-4.4,0-7.7,3.2-7.7,7.8c0,4.6,3.3,7.8,7.7,7.8C88.7,21.4,92,18.2,92,13.6z M100.5,13.6c0-7.3,5.7-12.6,13.4-12.6 c7.7,0,13.4,5.3,13.4,12.6c0,7.3-5.7,12.6-13.4,12.6C106.1,26.2,100.5,20.9,100.5,13.6z M121.5,13.6c0-4.6-3.3-7.8-7.7-7.8 c-4.4,0-7.7,3.2-7.7,7.8c0,4.6,3.3,7.8,7.7,7.8C118.2,21.4,121.5,18.2,121.5,13.6z M153.9,19.2c0,4.2-3.4,6.7-9.8,6.7h-12.6V1.4h12 c6.1,0,9.3,2.6,9.3,6.4c0,2.4-1.3,4.3-3.2,5.4C152.2,14,153.9,16.1,153.9,19.2z M137.1,5.6v5.8h5.6c2.8,0,4.3-1,4.3-2.9 c0-1.9-1.5-2.9-4.3-2.9H137.1z M148.3,18.6c0-2.1-1.6-3-4.5-3h-6.6v6h6.6C146.7,21.6,148.3,20.7,148.3,18.6z M156.3,23.4l1.9-4.3 c2.1,1.5,5.1,2.6,8.1,2.6c3.4,0,4.7-1.1,4.7-2.6c0-4.6-14.2-1.4-14.2-10.5c0-4.2,3.4-7.6,10.3-7.6c3.1,0,6.2,0.7,8.5,2.2l-1.7,4.3 c-2.3-1.3-4.6-1.9-6.8-1.9c-3.4,0-4.6,1.3-4.6,2.8c0,4.5,14.2,1.4,14.2,10.4c0,4.1-3.4,7.6-10.4,7.6 C162.4,26.2,158.5,25.1,156.3,23.4z" />
                <path fill="#f9bd2b" d="M44,30.3h0.8v2.6h3.4v-2.6H49v5.9h-0.8v-2.5h-3.4v2.5H44V30.3z M54.8,30.6c0.5,0.3,0.8,0.6,1.1,1.1 c0.3,0.5,0.4,1,0.4,1.5c0,0.6-0.1,1.1-0.4,1.5c-0.3,0.5-0.7,0.8-1.1,1.1c-0.5,0.3-1,0.4-1.6,0.4c-0.6,0-1.1-0.1-1.6-0.4 c-0.5-0.3-0.8-0.6-1.1-1.1c-0.3-0.5-0.4-1-0.4-1.5c0-0.6,0.1-1.1,0.4-1.5c0.3-0.5,0.6-0.8,1.1-1.1c0.5-0.3,1-0.4,1.6-0.4 C53.8,30.2,54.3,30.4,54.8,30.6z M52.1,31.3c-0.4,0.2-0.6,0.5-0.8,0.8s-0.3,0.7-0.3,1.1c0,0.4,0.1,0.8,0.3,1.1s0.5,0.6,0.8,0.8 c0.4,0.2,0.7,0.3,1.1,0.3c0.4,0,0.8-0.1,1.1-0.3c0.3-0.2,0.6-0.5,0.8-0.8s0.3-0.7,0.3-1.1c0-0.4-0.1-0.8-0.3-1.1s-0.5-0.6-0.8-0.8 C54,31.1,53.6,31,53.2,31C52.8,31,52.4,31.1,52.1,31.3z M57.5,30.3h1l2.2,4.1l2.1-4.1h1v5.9H63l0-4.7l-2.1,4.1h-0.5l-2.1-4.1v4.7 h-0.7V30.3z M65.4,30.3h4.1V31h-3.3v1.8h2.9v0.7h-2.9v1.9h3.4v0.7h-4.2V30.3z M74.8,30.7c0.3,0.3,0.5,0.6,0.5,1.1 c0,0.3-0.1,0.6-0.3,0.9c-0.2,0.2-0.5,0.4-0.8,0.5c0.4,0.1,0.7,0.2,1,0.5s0.3,0.6,0.3,1c0,0.5-0.2,0.9-0.6,1.2 c-0.4,0.3-0.9,0.4-1.6,0.4h-2.6v-5.9h2.5C74,30.3,74.5,30.4,74.8,30.7z M74.2,32.6c0.2-0.2,0.3-0.4,0.3-0.7c0-0.3-0.1-0.5-0.3-0.6 C74,31.1,73.7,31,73.4,31h-1.7v1.8h1.7C73.7,32.8,74,32.7,74.2,32.6z M74.4,35.2c0.2-0.2,0.4-0.4,0.4-0.7c0-0.3-0.1-0.5-0.4-0.7 c-0.2-0.2-0.6-0.3-1-0.3h-1.7v1.9h1.7C73.8,35.5,74.2,35.4,74.4,35.2z M80.7,36.2l-1.2-1.9c-0.1,0-0.2,0-0.3,0h-1.5v1.8h-0.8v-5.9 h2.3c0.7,0,1.3,0.2,1.7,0.5c0.4,0.3,0.6,0.8,0.6,1.5c0,0.5-0.1,0.9-0.3,1.2c-0.2,0.3-0.5,0.6-1,0.7l1.4,2H80.7z M79.2,33.6 c0.5,0,0.9-0.1,1.2-0.3c0.3-0.2,0.4-0.5,0.4-1c0-0.4-0.1-0.7-0.4-1c-0.3-0.2-0.7-0.3-1.2-0.3h-1.5v2.6H79.2z M83,30.3h0.8v5.9H83 V30.3z M89.4,30.7c0.5,0.3,0.8,0.6,1.1,1.1c0.3,0.4,0.4,1,0.4,1.5s-0.1,1.1-0.4,1.5c-0.3,0.4-0.6,0.8-1.1,1.1 c-0.5,0.3-1,0.4-1.6,0.4h-2.4v-5.9h2.4C88.5,30.3,89,30.4,89.4,30.7z M89,35.2c0.3-0.2,0.6-0.5,0.8-0.8c0.2-0.3,0.3-0.7,0.3-1.1 c0-0.4-0.1-0.8-0.3-1.1c-0.2-0.3-0.5-0.6-0.8-0.8c-0.3-0.2-0.7-0.3-1.1-0.3h-1.6v4.4h1.6C88.3,35.5,88.7,35.4,89,35.2z M96,33.3h0.7 v2.2c-0.3,0.2-0.6,0.4-1,0.6c-0.4,0.1-0.8,0.2-1.2,0.2c-0.6,0-1.1-0.1-1.6-0.4c-0.5-0.3-0.8-0.6-1.1-1.1c-0.3-0.5-0.4-1-0.4-1.5 c0-0.6,0.1-1.1,0.4-1.5c0.3-0.5,0.7-0.8,1.1-1.1c0.5-0.3,1-0.4,1.6-0.4c0.4,0,0.8,0.1,1.2,0.2c0.4,0.1,0.7,0.3,1,0.6l-0.5,0.6 c-0.2-0.2-0.5-0.4-0.8-0.5C95.1,31,94.8,31,94.5,31c-0.4,0-0.8,0.1-1.2,0.3c-0.4,0.2-0.6,0.5-0.8,0.8c-0.2,0.3-0.3,0.7-0.3,1.1 c0,0.4,0.1,0.8,0.3,1.1s0.5,0.6,0.8,0.8c0.4,0.2,0.7,0.3,1.2,0.3c0.2,0,0.5,0,0.8-0.1c0.3-0.1,0.5-0.2,0.7-0.3V33.3z M98.2,30.3h4.1 V31H99v1.8h2.9v0.7H99v1.9h3.4v0.7h-4.2V30.3z M110.1,30.6c0.5,0.3,0.8,0.6,1.1,1.1c0.3,0.5,0.4,1,0.4,1.5c0,0.6-0.1,1.1-0.4,1.5 c-0.3,0.5-0.7,0.8-1.1,1.1c-0.5,0.3-1,0.4-1.6,0.4s-1.1-0.1-1.6-0.4c-0.5-0.3-0.8-0.6-1.1-1.1c-0.3-0.5-0.4-1-0.4-1.5 c0-0.6,0.1-1.1,0.4-1.5c0.3-0.5,0.6-0.8,1.1-1.1c0.5-0.3,1-0.4,1.6-0.4C109.1,30.2,109.6,30.4,110.1,30.6z M107.4,31.3 c-0.4,0.2-0.6,0.5-0.8,0.8c-0.2,0.3-0.3,0.7-0.3,1.1c0,0.4,0.1,0.8,0.3,1.1c0.2,0.3,0.5,0.6,0.8,0.8c0.4,0.2,0.7,0.3,1.1,0.3 c0.4,0,0.8-0.1,1.1-0.3c0.3-0.2,0.6-0.5,0.8-0.8s0.3-0.7,0.3-1.1c0-0.4-0.1-0.8-0.3-1.1s-0.5-0.6-0.8-0.8c-0.3-0.2-0.7-0.3-1.1-0.3 C108.1,31,107.7,31.1,107.4,31.3z M113.9,35.1c0.3,0.3,0.7,0.5,1.2,0.5c0.5,0,0.9-0.2,1.2-0.5c0.3-0.3,0.4-0.7,0.4-1.3v-3.5h0.8v3.5 c0,0.8-0.2,1.4-0.7,1.8c-0.4,0.4-1,0.7-1.8,0.7c-0.8,0-1.4-0.2-1.8-0.7c-0.4-0.4-0.7-1-0.7-1.8v-3.5h0.8v3.5 C113.5,34.3,113.6,34.8,113.9,35.1z M118.4,30.3h4.6V31h-1.9v5.2h-0.8V31h-1.9V30.3z M130.3,30.6c0.5,0.3,0.8,0.6,1.1,1.1 c0.3,0.5,0.4,1,0.4,1.5c0,0.6-0.1,1.1-0.4,1.5c-0.3,0.5-0.7,0.8-1.1,1.1c-0.5,0.3-1,0.4-1.6,0.4s-1.1-0.1-1.6-0.4 c-0.5-0.3-0.8-0.6-1.1-1.1c-0.3-0.5-0.4-1-0.4-1.5c0-0.6,0.1-1.1,0.4-1.5c0.3-0.5,0.6-0.8,1.1-1.1c0.5-0.3,1-0.4,1.6-0.4 C129.3,30.2,129.8,30.4,130.3,30.6z M127.6,31.3c-0.4,0.2-0.6,0.5-0.8,0.8c-0.2,0.3-0.3,0.7-0.3,1.1c0,0.4,0.1,0.8,0.3,1.1 c0.2,0.3,0.5,0.6,0.8,0.8c0.4,0.2,0.7,0.3,1.1,0.3s0.8-0.1,1.1-0.3c0.3-0.2,0.6-0.5,0.8-0.8c0.2-0.3,0.3-0.7,0.3-1.1 c0-0.4-0.1-0.8-0.3-1.1c-0.2-0.3-0.5-0.6-0.8-0.8c-0.3-0.2-0.7-0.3-1.1-0.3S128,31.1,127.6,31.3z M133,30.3h3.8l0,0.7h-3V33h2.7v0.7 h-2.7v2.5H133V30.3z M139.3,30.3h4.6V31H142v5.2h-0.8V31h-1.9V30.3z M144.8,30.3h0.8v2.6h3.4v-2.6h0.8v5.9H149v-2.5h-3.4v2.5h-0.8 V30.3z M151.5,30.3h4.1V31h-3.3v1.8h2.9v0.7h-2.9v1.9h3.4v0.7h-4.2V30.3z M163.1,30.7c0.3,0.3,0.5,0.6,0.5,1.1 c0,0.3-0.1,0.6-0.3,0.9c-0.2,0.2-0.5,0.4-0.8,0.5c0.4,0.1,0.7,0.2,1,0.5s0.3,0.6,0.3,1c0,0.5-0.2,0.9-0.6,1.2 c-0.4,0.3-0.9,0.4-1.6,0.4h-2.6v-5.9h2.5C162.3,30.3,162.8,30.4,163.1,30.7z M162.5,32.6c0.2-0.2,0.3-0.4,0.3-0.7 c0-0.3-0.1-0.5-0.3-0.6c-0.2-0.2-0.5-0.2-0.8-0.2H160v1.8h1.7C162,32.8,162.3,32.7,162.5,32.6z M162.7,35.2c0.2-0.2,0.4-0.4,0.4-0.7 c0-0.3-0.1-0.5-0.4-0.7c-0.2-0.2-0.6-0.3-1-0.3H160v1.9h1.7C162.1,35.5,162.4,35.4,162.7,35.2z M169.3,30.6c0.5,0.3,0.8,0.6,1.1,1.1 c0.3,0.5,0.4,1,0.4,1.5c0,0.6-0.1,1.1-0.4,1.5c-0.3,0.5-0.7,0.8-1.1,1.1c-0.5,0.3-1,0.4-1.6,0.4s-1.1-0.1-1.6-0.4 c-0.5-0.3-0.8-0.6-1.1-1.1c-0.3-0.5-0.4-1-0.4-1.5c0-0.6,0.1-1.1,0.4-1.5c0.3-0.5,0.6-0.8,1.1-1.1c0.5-0.3,1-0.4,1.6-0.4 C168.3,30.2,168.8,30.4,169.3,30.6z M166.6,31.3c-0.4,0.2-0.6,0.5-0.8,0.8c-0.2,0.3-0.3,0.7-0.3,1.1c0,0.4,0.1,0.8,0.3,1.1 c0.2,0.3,0.5,0.6,0.8,0.8c0.4,0.2,0.7,0.3,1.1,0.3s0.8-0.1,1.1-0.3c0.3-0.2,0.6-0.5,0.8-0.8c0.2-0.3,0.3-0.7,0.3-1.1 c0-0.4-0.1-0.8-0.3-1.1c-0.2-0.3-0.5-0.6-0.8-0.8c-0.3-0.2-0.7-0.3-1.1-0.3S167,31.1,166.6,31.3z M171.5,30.3h0.9l1.6,2.2l1.6-2.2h1 l-2,2.8l2.2,3.1h-1l-1.7-2.4l-1.7,2.4h-1l2.2-3L171.5,30.3z" />
            </svg>
            <div class="about-seperator"></div>
            <div class="about-title">
                <div class="about-version">
                    <b>HOOBS Core</b><br>
                    Version {{ status[`${system}_version`] }}
                </div>
                <div class="button" v-on:click="checkUpdates()">{{ $t("check_for_updates") }}</div>
            </div>
            <br>
            <a href="https://hoobs.org" target="_blank">HOOBS.org</a><br>
            <br>
            Copyright &copy; {{ new Date().getFullYear() }} HOOBS.org. All rights reserved.
        </modal-dialog>
        <modal-dialog v-if="about && system === 'rocket'" width="550px" :ok="closeAbout">
            <svg version="1.1" width="137px" height="37.9px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 137 37.9">
                <path fill="#3f3a3c" d="M20.7,25.9v0.9H14l-4-6.8H6.9v6.8c-2,0-4,0-6,0C1,19,1,11.3,1,3.5c3.4,0,6.8,0,10.2,0c9.2,0,10.8,11,4.9,15 L20.7,25.9z M11.2,8.8c-1.4,0-2.9,0-4.3,0c0,1.9,0,3.9,0,5.8h4.3C14.4,14.6,14.6,8.9,11.2,8.8z" />
                <path fill="#3f3a3c" d="M62.4,3.3c4.8,0,10.1,2.6,11,8.8c-2,0-3.8,0-5.9,0c-0.8-2.4-2.6-3.4-5.1-3.4c-3.5,0-5.8,2.6-5.8,6.5 c0,3.4,2.3,6.4,5.8,6.4c2.5,0,4.6-1.3,5.2-3.7c2,0,3.8,0,5.9,0c-0.9,6.6-6.1,9.2-11.1,9.2c-5.9,0-11.9-3.9-12-11.8 C50.5,7.2,56.5,3.3,62.4,3.3z" />
                <path fill="#3f3a3c" d="M77.5,26.7V3.5c2,0,4,0,6.1,0v8.8H84c6,0,5.7-4.4,5.7-8.8c2,0,4.1,0,6.1,0c0,4.7,0.1,9.1-4.5,12.1l6.3,10.2v0.9 H91l-5.1-9c-0.8,0.1-1.5,0.1-2.3,0.1v8.9C81.5,26.7,79.5,26.7,77.5,26.7z" />
                <path fill="#3f3a3c" d="M115.6,8.8c-3.5,0-5.2,0-8.6,0v3.3h7.9c0,1.8,0,3.5,0,5.3H107c0,1.4,0,2.7,0,4.1c3.4,0,5.4,0,8.9,0 c0,1.7,0,3.5,0,5.3c-5.5,0-9.5,0-14.9,0c0-7.8,0-15.5,0-23.2c5.4,0,9.1,0,14.6,0C115.6,5.3,115.6,7,115.6,8.8z" />
                <path fill="#3f3a3c" d="M118.7,8.8c0-1.8,0-3.5,0-5.3H136c0,1.8,0,3.5,0,5.3h-5.7v17.9c-2,0-3.9,0-5.9,0V8.8H118.7z" />
                <path fill="#3f3a3c" d="M67.8,34.5c0-0.5-0.6-0.6-1.4-0.7c-1.6-0.1-2.7-0.7-2.7-2.3c-0.1-3.2,5.8-3.2,5.7,0c-0.7,0-1.2,0-1.8,0 c0-1-2-0.9-2.1,0c0,0.6,0.5,0.7,1.2,0.8c1.5,0.2,2.9,0.4,2.9,2.2c0,3.1-6.1,3.2-6.1-0.1c0.6,0,1.2,0,1.9,0 C65.5,35.4,67.8,35.4,67.8,34.5z" />
                <path fill="#3f3a3c" d="M77.7,29.3h0.7v7.5c-0.7,0-1.3,0-2,0v-3.3l-1.6,1.7h-0.2l-1.6-1.7v3.3c-0.7,0-1.3,0-2,0v-7.5h0.7l2.9,3.2 L77.7,29.3z" />
                <path fill="#3f3a3c" d="M84.6,35.8h-3l-0.4,0.9h-1.9v-0.3l3.4-7.3h0.8l3.4,7.3v0.3h-1.9L84.6,35.8z M83.2,32.2l-0.8,2H84L83.2,32.2z" />
                <path fill="#3f3a3c" d="M94.3,36.5v0.3h-2.1l-1.3-2.2h-1v2.2c-0.6,0-1.3,0-1.9,0c0-2.5,0-5,0-7.5c1.1,0,2.2,0,3.3,0 c2.9,0,3.5,3.5,1.6,4.8L94.3,36.5z M91.2,31c-0.4,0-0.9,0-1.4,0c0,0.6,0,1.2,0,1.8h1.4C92.3,32.8,92.3,31,91.2,31z" />
                <path fill="#3f3a3c" d="M94.7,31c0-0.6,0-1.1,0-1.7h5.6c0,0.6,0,1.1,0,1.7h-1.8v5.8c-0.6,0-1.3,0-1.9,0V31H94.7z" />
                <path fill="#e45e0e" d="M110.6,36.7c-0.7,0-1.3,0-2,0v-3h-2.3v3c-0.7,0-1.3,0-2,0v-7.5c0.6,0,1.3,0,2,0V32h2.3v-2.7c0.7,0,1.3,0,2,0 V36.7z" />
                <path fill="#e45e0e" d="M112.1,33c0-5.2,7.7-5.2,7.7,0C119.8,38.2,112.1,38.2,112.1,33z M117.8,33c0-2.7-3.8-2.7-3.8,0 C114.1,35.7,117.8,35.7,117.8,33z" />
                <path fill="#e45e0e" d="M127.9,29.3h0.7v7.5c-0.7,0-1.3,0-2,0v-3.3l-1.6,1.7h-0.2l-1.6-1.7v3.3c-0.7,0-1.3,0-2,0v-7.5h0.7l2.9,3.2 L127.9,29.3z" />
                <path fill="#e45e0e" d="M135.1,31c-1.1,0-1.7,0-2.8,0V32h2.5c0,0.6,0,1.1,0,1.7h-2.5c0,0.4,0,0.9,0,1.3c1.1,0,1.7,0,2.9,0 c0,0.6,0,1.1,0,1.7c-1.8,0-3,0-4.8,0c0-2.5,0-5,0-7.5c1.7,0,2.9,0,4.7,0C135.1,29.8,135.1,30.4,135.1,31z" />
                <path fill="#e65e0e" d="M48.8,8.5c0.4,0.5,0.5,1.1,0.7,1.8c0,0.1,0,0.2,0.1,0.3c0,3.5,0,7.1,0,10.6c-1.8-0.8-3.7-1.5-5.6-2 c-1.2-0.3-2.4-0.6-3.6-0.7c-0.4-0.2-0.8-0.2-1.2-0.2c-0.2,0-0.4-0.2-0.6,0c-0.2-0.1-0.1-0.2-0.1-0.3c0.3-1,0.4-2,0.4-3.1 c-0.1-1.1-0.3-2.3-0.6-3.4c0.9-0.1,1.7-0.2,2.6-0.4C43.6,10.5,46.3,9.7,48.8,8.5z" />
                <path fill="#ee8e00" d="M40.4,18.4c1.2,0.1,2.4,0.4,3.6,0.7c1.9,0.5,3.8,1.2,5.6,2c0,0.4,0,0.9,0,1.3c-0.1,0.1-0.1,0.3-0.1,0.5 c-0.2,0.9-0.5,1.6-1.2,2.2c-0.1,0.1-0.2,0.2-0.4,0.1c-0.5-0.3-1-0.3-1.6-0.3c-1.4-1-2.7-2.1-3.9-3.4C41.6,20.6,40.9,19.5,40.4,18.4z" />
                <path fill="#be2e1a" d="M38.9,29.1c-0.4-0.3-0.7-0.7-0.8-1.2c-0.2,0.1-0.2,0.3-0.3,0.4c-0.5,0.5-1,0.5-1.5,0.1 c-0.5-0.5-0.6-1.1-0.6-1.7c1.9,0,3.7,0.4,5.4,1.2c-0.5,0.5-0.9,1-1.6,1.2C39.3,29.1,39.1,29.1,38.9,29.1z" />
                <path fill="#be2e1a" d="M35.3,26.6c0,0.5-0.1,1-0.4,1.4c-0.5,0.8-1.3,0.8-1.9,0.1c0-0.1-0.1-0.1-0.2-0.3c-0.1,0.6-0.4,1-0.9,1.2 c-0.2,0-0.4,0-0.6,0c-0.6-0.3-1.1-0.7-1.5-1.2C31.6,27.1,33.4,26.6,35.3,26.6z" />
                <path fill="#f5b100" d="M48.8,8.5c-2.6,1.2-5.2,2-8,2.5c-0.9,0.2-1.7,0.3-2.6,0.4c-0.5-1.4-1.2-2.8-2.2-3.9c-0.6-0.7-0.6-0.7-1.2,0 c-1,1.2-1.7,2.5-2.2,3.9c-1.3,0-2.5-0.3-3.8-0.6c-2.3-0.5-4.6-1.3-6.8-2.3c0.4-0.6,0.9-1.1,1.6-1.4c1.3-0.8,2.6-1.5,4-2.3 c1.7-1,3.3-1.9,5-2.9c0.9-0.5,1.9-0.9,3-0.9c0.8,0,1.6,0.2,2.3,0.6c1.7,1,3.4,2,5.1,2.9c1.3,0.8,2.7,1.5,4,2.3 C47.7,7.3,48.4,7.8,48.8,8.5z" />
                <path fill="#d64317" d="M35.3,26.6c-1.9,0-3.7,0.5-5.4,1.2c-0.6-0.4-1.2-0.6-1.8-0.5c-0.1,0-0.2-0.1-0.2-0.2c-0.6-1.4-1.6-2.1-3.1-2.3 c0.6-0.5,1.3-1,1.9-1.5c1.3-1.2,2.5-2.5,3.4-4c0.2-0.3,0.4-0.7,0.5-1.1c0.1,0,0.1-0.1,0.2-0.1c0.5,0,1.1-0.2,1.6-0.1 c-1,0.8-1.4,2-1.2,3.2c0.1,0.7,0.2,1.4,0.4,2.1c0.1,0.2,0.1,0.4,0.2,0.7c0.1-0.2,0.1-0.4,0.2-0.5c0.4-1,0.9-2,1.8-2.8 c0.2-0.2,0.3-0.2,0.5,0c0.2,0.3,0.5,0.4,0.9,0.5c0.3,0,0.6,0,1,0c0.3,0,0.7-0.1,0.9-0.5c0.1-0.3,0.3-0.2,0.5,0 c0.8,0.8,1.4,1.8,1.8,2.8c0.1,0.2,0.1,0.3,0.2,0.6c0.2-0.9,0.4-1.7,0.5-2.5c0.2-1.4-0.1-2.7-1.3-3.6c0.2-0.1,0.4,0,0.6,0 c0.4,0,0.8,0,1.2,0.2c0.5,1.1,1.3,2.2,2.1,3.1c1.1,1.3,2.4,2.5,3.9,3.4c-1.5,0.1-2.5,0.9-3.1,2.2c-0.1,0.1-0.1,0.2-0.3,0.2 c-0.7-0.1-1.3,0.1-1.8,0.5c-1.7-0.8-3.5-1.2-5.4-1.2c-0.1-0.9,0-1.8,0.1-2.6c0.1-0.6,0.2-1.1,0.3-1.7c0-0.2,0-0.2-0.2-0.2 c-0.3,0.1-0.6,0.1-0.8,0c-0.2,0-0.3,0-0.2,0.2c0.2,1.3,0.5,2.5,0.5,3.8C35.3,26.3,35.3,26.5,35.3,26.6z" />
                <path fill="#ee8e00" d="M30.7,18.3c-0.1,0-0.1,0.1-0.2,0.1c0,0-0.1,0-0.1,0c-1.6,0.3-3.1,0.6-4.6,1.1c-1.5,0.5-2.9,1-4.3,1.6 c0-1.4,0-2.7,0-4.1c0-1.9,0-3.7,0-5.6c0-0.7,0.1-1.4,0.3-2.1c0.1-0.3,0.2-0.6,0.4-0.9c2.2,1,4.4,1.8,6.8,2.3 c1.2,0.3,2.5,0.5,3.8,0.6c-0.3,0.9-0.5,1.9-0.6,2.8c0,0-0.1,0.1-0.1,0.1c-0.1,0.8-0.4,1.6-0.6,2.3C31.2,17.2,30.9,17.7,30.7,18.3z" />
                <path fill="#e65e0e" d="M21.4,21.2c1.4-0.6,2.8-1.2,4.3-1.6c1.5-0.5,3.1-0.8,4.6-1.1c0,0,0.1,0,0.1,0c-0.1,0.4-0.3,0.7-0.5,1.1 c-0.9,1.5-2.1,2.8-3.4,4c-0.6,0.5-1.3,1-1.9,1.5c-0.6,0-1.1,0.1-1.6,0.4c-0.2,0.1-0.3,0-0.4-0.1c-0.7-0.7-1.1-1.5-1.2-2.5 C21.4,22.2,21.4,21.7,21.4,21.2z" />
                <path fill="#e65e0e" d="M32.1,14.1c-0.1,1.3,0,2.5,0.4,3.8c0.1,0.2,0,0.2-0.2,0.3c-0.5-0.1-1.1,0.1-1.6,0.1c0.2-0.6,0.5-1.2,0.7-1.8 C31.6,15.8,31.9,15,32.1,14.1C32,14.2,32.1,14.2,32.1,14.1z" />
                <path fill="#e65e0e" d="M35.5,12.4c0.9,0,1.6,0.7,1.6,1.6c0,0.9-0.7,1.6-1.6,1.6c-0.9,0-1.6-0.7-1.6-1.6C33.9,13.1,34.6,12.4,35.5,12.4 z" />
            </svg>
            <div class="about-seperator"></div>
            <div class="about-title">
                <div class="about-version">
                    <b>Rocket Core</b><br>
                    Version {{ status[`${system}_version`] }}
                </div>
                <div class="button" v-on:click="checkUpdates()">{{ $t("check_for_updates") }}</div>
            </div>
            <br>
            <a href="https://rocketsmarthome.com" target="_blank">RocketSmartHome.com</a><br>
            <br>
            Copyright &copy; {{ new Date().getFullYear() }} Rocket Smart Home. All rights reserved.
        </modal-dialog>
    </div>
</template>

<script>
    import ModalDialog from "@/components/modal-dialog.vue";
    import ServiceMenu from "@/components/service-menu.vue";
    import InstanceMenu from "@/components/instance-menu.vue";
    import Marquee from "@/components/loading-marquee.vue";

    export default {
        components: {
            "modal-dialog": ModalDialog,
            "service-menu": ServiceMenu,
            "instance-menu": InstanceMenu,
            "loading-marquee": Marquee
        },

        data() {
            return {
                status: null,
                loaded: false,
                about: false,
                instances: []
            }
        },

        computed: {
            visible() {
                return this.$store.state.menus;
            },

            locked() {
                return this.$store.state.locked;
            },

            defaultRoute() {
                return this.$client.default_route || "status";
            },

            user() {
                return this.$store.state.user;
            },

            system() {
                return this.$system;
            },

            title() {
                switch (this.$system) {
                    case "rocket":
                        return "Rocket";
                    
                    default:
                        return "HOOBS";
                }
            }
        },

        async mounted() {
            switch (this.$system) {
                case "rocket":
                    Chart.defaults.global.defaultFontColor = (this.$client.theme || `${this.system}-light`).endsWith("dark") ? "#e75e0f" : "#999";
                    break;
                
                default:
                    Chart.defaults.global.defaultFontColor = (this.$client.theme || `${this.system}-light`).endsWith("dark") ? "#f9bd2b" : "#999";
                    break;
            }

            document.body.addEventListener("error", (event) => {
                if (event.target.tagName === "IMG") {
                    event.target.parentNode.removeChild(event.target);
                }
            }, true);

            this.status = await this.api.get("/status");
            this.instances = await this.$instances();
            this.loaded = true;
        },

        updated() {
            this.loaded = true;
        },

        methods: {
            showAbout() {
                this.about = true;
            },

            closeAbout() {
                this.about = false;
            },

            donate() {
                window.open("https://www.paypal.me/hoobsofficial");
            },

            checkUpdates() {
                this.closeAbout();

                this.$router.push({
                    path: "/system"
                });
            },

            hide(...menu) {
                for (let i = 0; i < menu.length; i++) {
                    this.$store.commit("hide", menu[i]);
                }
            },

            toggle(menu) {
                switch (menu) {
                    case "instance":
                        this.hide("service");
                        break;

                    case "service":
                        this.hide("instance");
                        break;
                    
                    default:
                        this.hide("service", "instance");
                        break;
                }

                this.$store.commit("toggle", menu);
            },

            activeLink(...controller) {
                if (controller.filter(r => (this.$router.currentRoute || {}).name === r).length > 0) {
                    return "route-link route-link-on";
                }

                return "route-link";
            },

            activeIcon(...controller) {
                if (controller.filter(r => (this.$router.currentRoute || {}).name === r).length > 0) {
                    return "icon icon-on";
                }

                return "icon";
            },

            pluginIcon(data) {
                switch (data.plugin_icon.type) {
                    case "material":
                        return data.plugin_icon.name || "power";

                    case "svg":
                        if (!data.plugin_icon.encoded || data.plugin_icon.encoded === "") {
                            data.plugin_icon.encoded
                        }

                        try {
                            return atob(data.plugin_icon.encoded);
                        } catch {
                            return "power";
                        }
                }

                return "power";
            },

            routeName(name) {
                const title = name !== undefined;

                name = name || this.$router.currentRoute.name;

                switch (name) {
                    case "login":
                        return "";

                    case "help":
                        return `${!title ? " | " : ""}${this.$t("help")}`;

                    case "system":
                    case "terminal":
                        return `${!title ? " | " : ""}${this.$t("system")}`;

                    case "profile":
                        return `${!title ? " | " : ""}${this.$t("profile")}`;

                    case "status":
                        return `${!title ? " | " : ""}${this.$t("dashboard")}`;

                    case "log":
                        return `${!title ? " | " : ""}${this.$t("log")}`;

                    case "users":
                        return `${!title ? " | " : ""}${this.$t("users")}`;

                    case "plugin":
                    case "plugins":
                    case "search":
                    case "browse":
                        return `${!title ? " | " : ""}${this.$t("plugins")}`;

                    case "config":
                    case "config-advanced":
                        return `${!title ? " | " : ""}${this.$t("config")}`;

                    case "accessories":
                    case "layout":
                        return `${!title ? " | " : ""}${this.$t("accessories")}`;

                    default:
                        return "";
                }
            }
        }
    };
</script>

<style>
    @font-face {
        font-family: "Montserrat";
        font-style: normal;
        font-weight: 400;
        font-display: swap;
        src: local("Montserrat Regular"),
             local("Montserrat-Regular"),
             url(./assets/montserrat.woff2) format("woff2");
        unicode-range: U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F;
    }

    @font-face {
        font-family: "Montserrat Black";
        font-style: normal;
        font-weight: 900;
        font-display: swap;
        src: local("Montserrat Black"),
             local("Montserrat-Black"),
             url(./assets/montserrat-black.woff2) format("woff2");
        unicode-range: U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F;
    }
      
    @font-face {
        font-family: "Material Icons";
        font-style: normal;
        font-weight: 400;
        src: url(./assets/material.eot);
        src: local("Material Icons"),
             local("MaterialIcons-Regular"),
             url(./assets/material.woff2) format('woff2'),
             url(./assets/material.woff) format('woff'),
             url(./assets/material.ttf) format('truetype');
}
</style>

<style>
    html,
    body {
        margin: 0;
        padding: 0;
        height: 100%;
        overflow: hidden;
    }

    .service-loader {
        width: 100%;
        height: 2px;
        position: absolute;
        top: 0;
        left: 0;
    }

    .button,
    .button:link,
    .button:active,
    .button:visited {
        background: var(--button);
        color: var(--button-text) !important;
        text-decoration: none !important;
        display: inline-block;
        border: 1px var(--border) solid;
        border-radius: 3px;
        padding: 10px;
        cursor: pointer;
        user-select: none;
        margin: 0 10px 0 0;
        white-space: pre;
    }

    .button-primary,
    .button-primary:link,
    .button-primary:active,
    .button-primary:visited {
        background: var(--button-primary);
        color: var(--button-primary-text) !important;
        border: 1px var(--primary) solid;
    }

    .button-warning,
    .button-warning:link,
    .button-warning:active,
    .button-warning:visited {
        background: var(--warning);
        color: var(--warning-text) !important;
        border: 1px var(--warning) solid;
    }

    .button:hover {
        box-shadow: var(--elevation-small);
    }

    .vue-grid-placeholder {
        background: var(--button-primary) !important;
    }

    .hidden-submit {
        width: 1px;
        height: 1px;
        overflow: hidden;
        opacity: 0;
        position: absolute;
    }

    .icon {
        font-family: "Material Icons";
        font-weight: normal;
        font-style: normal;
        font-size: 24px;
        line-height: 1;
        letter-spacing: normal;
        text-transform: none;
        display: inline-block;
        white-space: nowrap;
        word-wrap: normal;
        direction: ltr;
        font-feature-settings: "liga";
        -webkit-font-smoothing: antialiased;
    }

    #app {
        margin: 0;
        padding: 0;
        height: 100%;
        background: var(--background);
        font-family: "Montserrat", sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        color: var(--text);
        display: flex;
        flex-direction: column;
    }

    #app a,
    #app a:link,
    #app a:active,
    #app a:visited {
        color: var(--link-text);
        text-decoration: none;
    }

    #app a:hover {
        text-decoration: underline;
    }

    #app .header {
        height: 57px;
        margin: 0 -10px;
        padding: 0 20px 0 30px;
        background: var(--primary);
        box-shadow: var(--elevation-large);
        display: flex;
        align-content: center;
        align-items: center;
        justify-content: space-between;
        user-select: none;
        z-index: 200;
    }

    #app .header .title {
        flex: 1;
        display: flex;
        align-content: center;
        align-items: center;
        user-select: none;
    }

    #app .header .logo {
        width: 27px;
        height: 27px;
        margin: 0 5px 0 0;
        user-select: none;
    }

    #app .header .header-logo-svg {
        fill: var(--logo-color);
    }

    #app .header .header-logo-svg-stroke {
        fill: none;
        stroke: var(--logo-color);
        stroke-miterlimit: 10;
        stroke-width: 2.5px;
    }

    #app .header h1 {
        margin: 0;
        padding: 0;
        line-height: normal;
        color: var(--primary-text);
        font-size: 1.2rem;
        font-weight: normal;
        cursor: default;
        user-select: none;
    }

    #app .header .title-logo-text {
        font-weight: bold;
        font-family: "Montserrat Black", sans-serif;
        font-size: 24px;
        margin: 0 7px 0 0;
    }

    #app .header .service {
        width: 32px;
        height: 32px;
        padding: 4px 0;
        box-sizing: border-box;
        border-radius: 16px;
        color: var(--primary-text);
        text-align: center;
        cursor: pointer;
        user-select: none;
        opacity: 0.9;
    }

    #app .header .service:hover {
        background: var(--primary-dark);
    }

    #app .header .service-button:hover {
        opacity: 1;
    }

    #app .header .instance {
        display: flex;
        align-content: center;
        align-items: center;
        margin: 0 10px 0 0;
        color: var(--primary-text);
        cursor: pointer;
    }

    #app .about-seperator {
        height: 1px;
        background: #e5e5e5;
        margin: 10px 0;
    }

    #app .about-title {
        display: flex;
        margin: 0 -10px 0 0;
    }

    #app .about-version {
        flex: 1;
    }

    #app .layout {
        flex: 1;
        display: flex;
        overflow: hidden;
        flex-direction: row;
    }

    #app .nav {
        min-width: 57px;
        padding: 0 0 15px 0;
        background: var(--nav-background);
        box-shadow: var(--elevation-large);
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        user-select: none;
        z-index: 100;
    }

    #app .nav .routes {
        min-width: 57px;
        display: flex;
        flex-direction: column;
        align-content: center;
        align-items: center;
    }

    #app .nav .action-seperator {
        width: 100%;
        height: 1px;
        margin: 10px 0 0 0;
        padding: 0 17px;
        box-sizing: border-box;
    }

    #app .nav .action-seperator div {
        background: var(--nav-lignt);
        height: 1px;
    }

    #app .nav a,
    #app .nav a:link,
    #app .nav a:active,
    #app .nav a:visited,
    #app .nav .action-link {
        color: var(--nav-text);
        text-decoration: none;
        margin-top: 15px;
        width: 100%;
        text-align: left;
        display: flex;
        align-items: center;
        align-content: center;
        justify-content: flex-start;
        cursor: pointer;
    }

    #app .nav a:hover,
    #app .nav .action-link:hover {
        color: var(--nav-text-light) !important;
        text-decoration: none;
    }

    #app .nav .route-link {
        font-size: 17px;
        margin: 0 24px 0 -6px;
    }

    #app .nav .icon {
        margin: 0 16px;
    }

    #app .nav .route-link-on,
    #app .nav .icon-on,
    #app .nav .route-link-on:hover,
    #app .nav .icon-on:hover {
        color: var(--title-text) !important;
    }

    #app .nav .icon svg {
        width: 24px;
        height: 24px;
    }

    #app .content {
        flex: 1;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        font-size: 12pt;
    }

    .mobile-show {
        display: none;
    }

    @media (min-width: 300px) and (max-width: 815px) {
        .mobile-hide {
            display: none !important;
        }

        .mobile-show {
            display: unset;
        }

        #app .layout {
            overflow: auto;
        }

        #app .content {
            overflow: auto;
        }
    }
</style>
