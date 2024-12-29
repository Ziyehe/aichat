Page({
  data: {
    inputValue: '',
    maxLength: 200,
    messages: [],
    scrollTop: 0,
    loading: false,
    userInfo: null,
    aiInfo: {
      avatarUrl: '/images/ai-avatar-small.png',
      nickName: '维享小助手'
    },
    apiConfig: {
      url: 'https://api.coze.cn/v1/workflow/run',
      workflowId: '7452631677338124323',  // 替换为你的 workflow_id
      token: 'Bearer pat_za2EKbpRSv40xBTDjpe17CZX5e09oqSrsnbGCyUTPtZf5fuQNAnvxTgt36REhH2M'  // 替换为你的 token
    }
  },

  onLoad() {
    const userInfo = wx.getStorageSync('userInfo')
    this.setData({ userInfo })
  },

  handleInput(e) {
    this.setData({
      inputValue: e.detail.value
    })
  },

  async handleSend() {
    if (!this.data.inputValue.trim()) return
    
    const userMessage = {
      type: 'user',
      content: this.data.inputValue,
      timestamp: new Date().getTime(),
      userInfo: this.data.userInfo
    }

    const inputContent = this.data.inputValue
    this.setData({ inputValue: '' })

    this.setData({
      messages: [...this.data.messages, userMessage]
    })

    wx.nextTick(() => {
      this.scrollToBottom()
    })

    this.setData({ loading: true })

    try {
      const response = await this.callCozeAPI(inputContent)
      console.log('Response from API call:', response)
      if (response) {
        const aiResponse = {
          type: 'ai',
          content: response.content,
          timestamp: new Date().getTime(),
          userInfo: this.data.aiInfo
        }

        console.log('AI Response before setData:', aiResponse)
        this.setData({
          messages: [...this.data.messages, aiResponse],
          loading: false
        }, () => {
          console.log('Current messages after setData:', this.data.messages)
        })

        wx.nextTick(() => {
          this.scrollToBottom()
        })
      }
    } catch (error) {
      console.error('发送消息失败:', error)
      wx.showToast({
        title: '发送失败，请重试',
        icon: 'none',
        duration: 2000
      })
      this.setData({ loading: false })
    }
  },

  scrollToBottom() {
    wx.nextTick(() => {
      wx.createSelectorQuery()
        .select('#message-container')
        .boundingClientRect((rect) => {
          if (!rect) return;
          this.setData({
            scrollTop: rect.height * 2
          })
        })
        .exec()
    })
  },

  async callCozeAPI(content) {
    try {
      const response = await new Promise((resolve, reject) => {
        wx.request({
          url: this.data.apiConfig.url,
          method: 'POST',
          header: {
            'Authorization': this.data.apiConfig.token,
            'Content-Type': 'application/json'
          },
          data: {
            workflow_id: this.data.apiConfig.workflowId,
            parameters: {
              BOT_USER_INPUT: content
            }
          },
          timeout: 30000,
          success: (res) => {
            console.log('API Response Raw:', res)
            if (res.statusCode === 200) {
              resolve(res)
            } else {
              console.error('API Error Status:', res.statusCode)
              reject(new Error(`HTTP Error: ${res.statusCode}`))
            }
          },
          fail: (err) => {
            console.error('API Request Failed:', err)
            reject(err)
          }
        })
      })

      if (!response.data) {
        console.error('No Response Data')
        throw new Error('No response data')
      }

      console.log('Response Data:', response.data)

      if (response.data.code === 0) {
        if (!response.data.data) {
          console.error('No Data Field')
          throw new Error('No data field in response')
        }

        try {
          const responseData = JSON.parse(response.data.data)
          console.log('Parsed Response:', responseData)
          const output = responseData.data || ''
          console.log('Final Output:', output)

          return {
            content: output
          }
        } catch (parseError) {
          console.error('Parse Error:', parseError, 'Raw Data:', response.data.data)
          throw new Error('解析响应数据失败')
        }
      } else {
        console.error('API Error:', response.data)
        throw new Error(response.data?.msg || '请求失败')
      }
    } catch (error) {
      console.error('API调用失败:', error)
      const errorMessage = error.errMsg || error.message || '网络请求失败，请稍后重试'
      wx.showToast({
        title: errorMessage,
        icon: 'none',
        duration: 3000
      })
      throw error
    }
  }
}) 