/**************************************************************************************************
 * hoobs-core                                                                                     *
 * Copyright (C) 2020 HOOBS                                                                       *
 *                                                                                                *
 * This program is free software: you can redistribute it and/or modify                           *
 * it under the terms of the GNU General Public License as published by                           *
 * the Free Software Foundation, either version 3 of the License, or                              *
 * (at your option) any later version.                                                            *
 *                                                                                                *
 * This program is distributed in the hope that it will be useful,                                *
 * but WITHOUT ANY WARRANTY; without even the implied warranty of                                 *
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the                                  *
 * GNU General Public License for more details.                                                   *
 *                                                                                                *
 * You should have received a copy of the GNU General Public License                              *
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.                          *
 **************************************************************************************************/

const Request = require('axios')
const HBS = require("../server/instance")

module.exports = class RingLogin {
  constructor() {
    HBS.app.post("/api/ring-login", (request, response) => this.attemptLogin(request, response));
  }

  async attemptLogin (request, response) {
    const { email, password, verificationCode } = request.body

    try {
      const tokenResponse = await Request.post('https://oauth.ring.com/oauth/token',
        {
          client_id: 'ring_official_android',
          scope: 'client',
          grant_type: 'password',
          password,
          username: email
        },
        {
          headers: {
            'content-type': 'application/json',
            '2fa-support': 'true',
            '2fa-code': verificationCode || ''
          }
        })

      response.send(tokenResponse.data)
    } catch (e) {
      if (e.response.data) {
        // 2fa required or bad credentials
        response.send(e.response.data)
      } else {
        HBS.log.error('[homebridge-ring] - Failed to get credentials')
        HBS.log.error(e)
        response.send({ error: e })
      }
    }
  }
}
