Page({
  data: {
    userInfo: null,
    hasUserInfo: false,
    canIUseGetUserProfile: false,
  },

  onLoad() {
    if (wx.getUserProfile) {
      this.setData({
        canIUseGetUserProfile: true
      })
    }
  },

  getUserProfile() {
    // 防抖处理，避免频繁调用
    if (this.getUserProfileLock) return
    this.getUserProfileLock = true

    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: (res) => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
        wx.setStorageSync('userInfo', res.userInfo)
        wx.navigateTo({
          url: '/pages/chat/chat'
        })
      },
      fail: (err) => {
        console.error('获取用户信息失败:', err)
        wx.showToast({
          title: '获取用户信息失败',
          icon: 'none'
        })
      },
      complete: () => {
        // 解除锁定
        setTimeout(() => {
          this.getUserProfileLock = false
        }, 2000)
      }
    })
  }
}) 